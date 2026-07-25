const { pool } = require('../db/pool');

async function getOrderById(orderId) {
  const orderRes = await pool.query(
    'SELECT id, customer_id AS "customerId", total_amount AS "totalAmount", status, created_at AS "createdAt" FROM orders WHERE id = $1',
    [orderId]
  );

  if (orderRes.rows.length === 0) {
    return null;
  }

  const order = orderRes.rows[0];

  const itemsRes = await pool.query(
    `SELECT oi.id, oi.product_id AS "productId", p.name AS "productName", oi.quantity, oi.unit_price AS "unitPrice", oi.total_price AS "totalPrice"
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1`,
    [orderId]
  );

  order.items = itemsRes.rows;
  return order;
}

async function getOrdersByCustomer(customerId) {
  const { rows } = await pool.query(
    'SELECT id, customer_id AS "customerId", total_amount AS "totalAmount", status, created_at AS "createdAt" FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
    [customerId]
  );

  return rows;
}

module.exports = {
  getOrderById,
  getOrdersByCustomer,
};
