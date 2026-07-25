const express = require('express');
const crypto = require('crypto');
const { pool } = require('../db/postgres');
const { get, del } = require('../db/redis');
const { incrementMetric } = require('./metrics');
const { logger } = require('../middleware/logger');

const router = express.Router();

router.post('/', async (req, res, next) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    incrementMetric('checkoutFailuresTotal');
    return res.status(400).json({ error: 'sessionId is required to perform checkout' });
  }

  let cart;
  try {
    const rawCart = await get(`cart:${sessionId}`);
    if (!rawCart) {
      incrementMetric('checkoutFailuresTotal');
      return res.status(404).json({ error: 'Cart session not found or expired' });
    }
    cart = JSON.parse(rawCart);
  } catch (err) {
    incrementMetric('checkoutFailuresTotal');
    logger.error({ err, sessionId }, 'Checkout failed during cart retrieval from Redis');
    return next(err);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const { rows } = await client.query(
        'SELECT id, name, price, stock FROM products WHERE id = $1 FOR UPDATE',
        [item.productId]
      );

      if (rows.length === 0) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const product = rows[0];
      const quantity = item.quantity || 1;

      if (product.stock < quantity) {
        const stockErr = new Error(`Insufficient stock for product ${product.name}. Available: ${product.stock}, requested: ${quantity}`);
        stockErr.statusCode = 400;
        throw stockErr;
      }

      const itemTotal = parseFloat(product.price) * quantity;
      totalAmount += itemTotal;

      await client.query(
        'UPDATE products SET stock = stock - $1 WHERE id = $2',
        [quantity, item.productId]
      );

      orderItems.push({
        productId: product.id,
        name: product.name,
        unitPrice: parseFloat(product.price),
        quantity,
        totalPrice: parseFloat(itemTotal.toFixed(2)),
      });
    }

    const orderId = `order_${crypto.randomUUID()}`;
    const formattedTotal = parseFloat(totalAmount.toFixed(2));

    await client.query(
      'INSERT INTO orders (id, customer_id, total_amount, status, items) VALUES ($1, $2, $3, $4, $5)',
      [orderId, cart.customerId, formattedTotal, 'COMPLETED', JSON.stringify(orderItems)]
    );

    await client.query('COMMIT');

    try {
      await del(`cart:${sessionId}`);
    } catch (redisErr) {
      logger.warn({ redisErr }, 'Failed to clear cart session from Redis after order completion');
    }

    incrementMetric('ordersProcessedTotal');
    logger.info({ orderId, sessionId, customerId: cart.customerId }, 'Checkout transaction completed successfully');

    res.status(201).json({
      order: {
        id: orderId,
        customerId: cart.customerId,
        totalAmount: formattedTotal,
        status: 'COMPLETED',
        items: orderItems,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    incrementMetric('checkoutFailuresTotal');
    logger.error({ err, sessionId }, 'Checkout processing failed and transaction was rolled back');
    next(err);
  } finally {
    client.release();
  }
});

module.exports = router;
