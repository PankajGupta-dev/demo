const Redis = require('ioredis');
const { logger } = require('../middleware/logger');
const { checkRedisChaos } = require('../chaos/redisOutage');

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  lazyConnect: true,
  maxRetriesPerRequest: 1,
});

redisClient.on('connect', () => {
  logger.info('Redis client connected successfully');
});

redisClient.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

async function get(key) {
  checkRedisChaos();
  return await redisClient.get(key);
}

async function set(key, value, mode, duration) {
  checkRedisChaos();
  if (mode && duration) {
    return await redisClient.set(key, value, mode, duration);
  }
  return await redisClient.set(key, value);
}

async function del(key) {
  checkRedisChaos();
  return await redisClient.del(key);
}

async function checkRedisHealth() {
  try {
    checkRedisChaos();
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
    return false;
  }
}

module.exports = {
  redisClient,
  get,
  set,
  del,
  checkRedisHealth,
};
