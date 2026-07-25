const crypto = require('crypto');
const { pool } = require('../db/pool');
const { redis } = require('../redis/client');
const logger = require('../utils/logger');
const { getProductById } = require('./productService');

const SESSION_TTL_SECONDS = 1800; // 30 minutes

async function createCheckoutSession(customerId, items) {
  if (!customerId || !Array.isArray(items) || items.length === 0) {
    const err = new Error('Invalid checkout session payload: customerId and items are required');
    err.statusCode = 400;
    throw err;
  }

  let totalAmount = 0;
  const validatedItems = [];

  for (const item of items) {
    if (!item.productId || !item.quantity || item.quantity <= 0) {
      const err = new Error(`Invalid item formatting: ${JSON.stringify(item)}`);
      err.statusCode = 400;
      throw err;
    }

    const product = await getProductById(item.productId);
    if (!product) {
      const err = new Error(`Product not found: ${item.productId}`);
      err.statusCode = 404;
      throw err;
    }

    if (product.stockQuantity < item.quantity) {
      const err = new Error(`Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`);
      err.statusCode = 400;
      throw err;
    }

    const unitPrice = parseFloat(product.price);
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    validatedItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice,
      totalPrice: itemTotal,
    });
  }

  const sessionId = `session_${crypto.randomUUID()}`;
  const sessionData = {
    sessionId,
    customerId,
    items: validatedItems,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    createdAt: new Date().toISOString(),
  };

  await redis.set(`checkout_session:${sessionId}`, JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS);
  logger.info({ sessionId, customerId, totalAmount }, 'Checkout session created successfully');

  return sessionData;
}

async function getCheckoutSession(sessionId) {
  const data = await redis.get(`checkout_session:${sessionId}`);
  if (!data) {
    return null;
  }
  return JSON.parse(data);
}

async function processCheckout(sessionId) {
  const session = await getCheckoutSession(sessionId);
  if (!session) {
    const err = new Error('Checkout session not found or expired');
    err.statusCode = 404;
    throw err;
  }

  const lockKey = `lock:checkout:${sessionId}`;
  const acquireLock = await redis.set(lockKey, 'locked', 'NX', 'EX', 10);
  if (!acquireLock) {
    const err = new Error('Checkout processing already in progress for this session');
    err.statusCode = 409;
    throw err;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const item of session.items) {
      const { rows } = await client.query(
        'SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );

      if (rows.length === 0) {
        throw new Error(`Product ${item.productId} no longer exists`);
      }

      const currentStock = rows[0].stock_quantity;
      if (currentStock < item.quantity) {
        const err = new Error(`Stock updated during checkout. Product ${item.productId} stock insufficient`);
        err.statusCode = 400;
        throw err;
      }

      await client.query(
        'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [item.quantity, item.productId]
      );
    }

    const orderId = `ord_${crypto.randomUUID()}`;
    await client.query(
      'INSERT INTO orders (id, customer_id, total_amount, status) VALUES ($1, $2, $3, $4)',
      [orderId, session.customerId, session.totalAmount, 'COMPLETED']
    );

    for (const item of session.items) {
      const orderItemId = `item_${crypto.randomUUID()}`;
      await client.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderItemId, orderId, item.productId, item.quantity, item.unitPrice, item.totalPrice]
      );
    }

    await client.query('COMMIT');

    // Invalidate product catalog cache after stock modification
    await redis.del('products:all');
    for (const item of session.items) {
      await redis.del(`product:${item.productId}`);
    }

    // Delete completed checkout session
    await redis.del(`checkout_session:${sessionId}`);

    logger.info({ orderId, sessionId, customerId: session.customerId }, 'Checkout process completed successfully');

    return {
      orderId,
      customerId: session.customerId,
      totalAmount: session.totalAmount,
      status: 'COMPLETED',
      items: session.items,
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, sessionId }, 'Checkout processing failed and transaction rolled back');
    throw err;
  } finally {
    client.release();
    await redis.del(lockKey);
  }
}

module.exports = {
  createCheckoutSession,
  getCheckoutSession,
  processCheckout,
};
