const express = require('express');
const { checkPostgresHealth } = require('../db/postgres');
const { checkRedisHealth } = require('../db/redis');
const { getBadEnvStatus } = require('../chaos/badEnvVar');

const router = express.Router();

router.get('/', async (req, res) => {
  if (getBadEnvStatus()) {
    return res.status(500).json({
      status: 'DOWN',
      error: 'CRITICAL_ENV_FAILURE: Bad environment variable injected',
      timestamp: new Date().toISOString(),
    });
  }

  const [postgresHealthy, redisHealthy] = await Promise.all([
    checkPostgresHealth(),
    checkRedisHealth(),
  ]);

  const isHealthy = postgresHealthy && redisHealthy;
  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? 'UP' : 'DOWN',
    timestamp: new Date().toISOString(),
    services: {
      postgres: postgresHealthy ? 'UP' : 'DOWN',
      redis: redisHealthy ? 'UP' : 'DOWN',
    },
  });
});

module.exports = router;
