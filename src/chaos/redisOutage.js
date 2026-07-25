const { logger } = require('../middleware/logger');

let isRedisOutageActive = false;

function setRedisOutage(state) {
  isRedisOutageActive = Boolean(state);
  logger.warn({ isRedisOutageActive }, 'Redis outage chaos state updated');
}

function getRedisOutageStatus() {
  return isRedisOutageActive;
}

function checkRedisChaos() {
  if (isRedisOutageActive) {
    const err = new Error('ECONNREFUSED: Redis instance unreachable (Chaos Injection)');
    err.code = 'ECONNREFUSED';
    throw err;
  }
}

module.exports = {
  setRedisOutage,
  getRedisOutageStatus,
  checkRedisChaos,
};
