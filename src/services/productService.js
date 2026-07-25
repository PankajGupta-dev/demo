const { pool } = require('../db/pool');
const { redis } = require('../redis/client');
const logger = require('../utils/logger');

const CACHE_TTL_SECONDS = 300;

async function getAllProducts() {
  const cacheKey = 'products:all';

  try {
    const cachedProducts = await redis.get(cacheKey);
    if (cachedProducts) {
      logger.debug('Cache hit for all products');
      return JSON.parse(cachedProducts);
    }
  } catch (err) {
    logger.warn({ err }, 'Redis error while retrieving product cache');
  }

  const { rows } = await pool.query(
    'SELECT id, name, description, price, stock_quantity AS "stockQuantity" FROM products ORDER BY created_at ASC'
  );

  try {
    await redis.set(cacheKey, JSON.stringify(rows), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err }, 'Redis error while caching product catalog');
  }

  return rows;
}

async function getProductById(productId) {
  const cacheKey = `product:${productId}`;

  try {
    const cachedProduct = await redis.get(cacheKey);
    if (cachedProduct) {
      logger.debug({ productId }, 'Cache hit for product');
      return JSON.parse(cachedProduct);
    }
  } catch (err) {
    logger.warn({ err, productId }, 'Redis error while retrieving product cache');
  }

  const { rows } = await pool.query(
    'SELECT id, name, description, price, stock_quantity AS "stockQuantity" FROM products WHERE id = $1',
    [productId]
  );

  if (rows.length === 0) {
    return null;
  }

  const product = rows[0];

  try {
    await redis.set(cacheKey, JSON.stringify(product), 'EX', CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err, productId }, 'Redis error while caching product');
  }

  return product;
}

module.exports = {
  getAllProducts,
  getProductById,
};
