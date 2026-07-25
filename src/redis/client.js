const Redis = require('ioredis');
const config = require('../config/env');
const logger = require('../utils/logger');

const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    logger.warn({ attempt: times, delay }, 'Retrying Redis connection...');
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redis.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis client encountered an error');
});

async function checkRedisHealth() {
  try {
    const pingResponse = await redis.ping();
    return pingResponse === 'PONG';
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
    return false;
  }
}

module.exports = {
  redis,
  checkRedisHealth,
};
