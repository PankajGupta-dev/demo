const { checkDbHealth } = require('../db/pool');
const { checkRedisHealth } = require('../redis/client');

async function liveness(req, res) {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
}

async function readiness(req, res) {
  const [dbHealthy, redisHealthy] = await Promise.all([
    checkDbHealth(),
    checkRedisHealth(),
  ]);

  const status = dbHealthy && redisHealthy ? 'UP' : 'DOWN';
  const statusCode = status === 'UP' ? 200 : 503;

  res.status(statusCode).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      postgres: dbHealthy ? 'UP' : 'DOWN',
      redis: redisHealthy ? 'UP' : 'DOWN',
    },
  });
}

module.exports = {
  liveness,
  readiness,
};
