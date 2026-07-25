const express = require('express');
const { setRedisOutage, getRedisOutageStatus } = require('../chaos/redisOutage');
const { setBadEnv, getBadEnvStatus } = require('../chaos/badEnvVar');
const { logger } = require('../middleware/logger');

const router = express.Router();

router.get('/chaos', (req, res) => {
  res.json({
    chaos: {
      redisOutage: getRedisOutageStatus(),
      badEnvVar: getBadEnvStatus(),
    },
  });
});

router.post('/chaos', (req, res) => {
  const { type, enabled, redisOutage, badEnv } = req.body;

  if (type === 'redis_outage' || redisOutage !== undefined) {
    const state = enabled !== undefined ? enabled : redisOutage;
    setRedisOutage(state);
  }

  if (type === 'bad_env' || badEnv !== undefined) {
    const state = enabled !== undefined ? enabled : badEnv;
    setBadEnv(state);
  }

  logger.warn({ currentChaos: req.body }, 'Admin updated failure injection settings');

  res.json({
    message: 'Chaos configuration updated successfully',
    chaos: {
      redisOutage: getRedisOutageStatus(),
      badEnvVar: getBadEnvStatus(),
    },
  });
});

router.post('/chaos/reset', (req, res) => {
  setRedisOutage(false);
  setBadEnv(false);

  logger.info('Admin reset all active chaos simulations');

  res.json({
    message: 'All chaos simulations reset to normal operation',
    chaos: {
      redisOutage: false,
      badEnvVar: false,
    },
  });
});

module.exports = router;
