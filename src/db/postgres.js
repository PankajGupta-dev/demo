const { Pool } = require('pg');
const { logger } = require('../middleware/logger');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  user: process.env.PGUSER || 'checkout_user',
  password: process.env.PGPASSWORD || 'checkout_password',
  database: process.env.PGDATABASE || 'checkout_db',
  max: parseInt(process.env.PGMAX, 10) || 20,
  idleTimeoutMillis: parseInt(process.env.PGIDLETIMEOUTMS, 10) || 30000,
  connectionTimeoutMillis: parseInt(process.env.PGCONNECTIONTIMEOUTMS, 10) || 5000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

async function initPostgres() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customer_id VARCHAR(64) NOT NULL,
        total_amount NUMERIC(10, 2) NOT NULL,
        status VARCHAR(32) NOT NULL,
        items JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    logger.info('PostgreSQL tables verified/created successfully');
  } catch (err) {
    logger.error({ err }, 'Failed to initialize PostgreSQL schema');
    throw err;
  } finally {
    client.release();
  }
}

async function checkPostgresHealth() {
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
  initPostgres,
  checkPostgresHealth,
};
