const express = require('express');
const { pool } = require('../db/postgres');
const { logger } = require('../middleware/logger');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, price, stock FROM products ORDER BY created_at ASC');
    res.json({ products: rows });
  } catch (err) {
    logger.error({ err }, 'Failed to fetch products');
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id, name, description, price, stock FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: rows[0] });
  } catch (err) {
    logger.error({ err, productId: req.params.id }, 'Failed to fetch product by id');
    next(err);
  }
});

module.exports = router;
