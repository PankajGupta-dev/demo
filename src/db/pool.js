const { Pool } = require('pg');
const config = require('../config/env');
const logger = require('../utils/logger');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

async function initDb() {
  const client = await pool.connect();
  try {
    logger.info('Initializing PostgreSQL schema...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        stock_quantity INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id VARCHAR(64) PRIMARY KEY,
        order_id VARCHAR(64) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id VARCHAR(64) NOT NULL REFERENCES products(id),
        quantity INT NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL,
        total_price NUMERIC(10, 2) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
      CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    `);

    // Seed default sample products if table is empty
    const { rows } = await client.query('SELECT COUNT(*) FROM products');
    if (parseInt(rows[0].count, 10) === 0) {
      logger.info('Seeding default demo products...');
      await client.query(`
        INSERT INTO products (id, name, description, price, stock_quantity) VALUES
        ('prod-1', 'OpsForge Enterprise Agent License', 'Autonomous Platform Engineer Full License', 499.99, 100),
        ('prod-2', 'Cloud Reliability Toolkit', 'Automated incident recovery and monitoring suite', 149.50, 250),
        ('prod-3', 'Telemetry Collector Node', 'High-throughput edge log & metric aggregator', 79.00, 500)
      `);
    }

    logger.info('PostgreSQL schema initialization complete');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize PostgreSQL schema');
    throw err;
  } finally {
    client.release();
  }
}

async function checkDbHealth() {
  try {
    const res = await pool.query('SELECT 1 AS healthy');
    return res.rows[0].healthy === 1;
  } catch (err) {
    logger.error({ err }, 'PostgreSQL health check failed');
    return false;
  }
}

module.exports = {
  pool,
  initDb,
  checkDbHealth,
};
