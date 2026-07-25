const express = require('express');
const crypto = require('crypto');
const { get, set, del } = require('../db/redis');
const { incrementMetric } = require('./metrics');
const { logger } = require('../middleware/logger');

const router = express.Router();
const CART_TTL = 1800;

router.post('/', async (req, res, next) => {
  try {
    const { customerId, items } = req.body;
    if (!customerId || !Array.isArray(items)) {
      return res.status(400).json({ error: 'customerId and items array are required' });
    }

    const sessionId = req.body.sessionId || `cart_${crypto.randomUUID()}`;
    const cartData = {
      sessionId,
      customerId,
      items,
      updatedAt: new Date().toISOString(),
    };

    await set(`cart:${sessionId}`, JSON.stringify(cartData), 'EX', CART_TTL);
    incrementMetric('cartSessionsCreatedTotal');

    logger.info({ sessionId, customerId }, 'Cart session saved in Redis');
    res.status(201).json({ cart: cartData });
  } catch (err) {
    logger.error({ err }, 'Failed to save cart session in Redis');
    next(err);
  }
});

router.get('/:sessionId', async (req, res, next) => {
  try {
    const data = await get(`cart:${req.params.sessionId}`);
    if (!data) {
      return res.status(404).json({ error: 'Cart session not found or expired' });
    }
    res.json({ cart: JSON.parse(data) });
  } catch (err) {
    logger.error({ err, sessionId: req.params.sessionId }, 'Failed to retrieve cart session from Redis');
    next(err);
  }
});

router.delete('/:sessionId', async (req, res, next) => {
  try {
    await del(`cart:${req.params.sessionId}`);
    res.json({ message: 'Cart session deleted successfully' });
  } catch (err) {
    logger.error({ err, sessionId: req.params.sessionId }, 'Failed to delete cart session from Redis');
    next(err);
  }
});

module.exports = router;
