const { pool } = require('./postgres');
const { logger } = require('../middleware/logger');

async function seedProducts() {
  const { rows } = await pool.query('SELECT COUNT(*) FROM products');
  const count = parseInt(rows[0].count, 10);

  if (count === 0) {
    logger.info('Seeding product catalog...');
    await pool.query(`
      INSERT INTO products (id, name, description, price, stock) VALUES
      ('prod_1', 'OpsForge Platform License', 'Autonomous Platform Engineer Enterprise Plan', 499.99, 100),
      ('prod_2', 'Cloud Reliability Agent', 'Automated incident recovery node', 149.50, 250),
      ('prod_3', 'Telemetry Collector Pro', 'High-throughput log and metric stream processor', 79.00, 500)
    `);
    logger.info('Product catalog seeded successfully');
  }
}

module.exports = {
  seedProducts,
};
