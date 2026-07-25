const { logger } = require('../middleware/logger');

let isBadEnvActive = false;

function setBadEnv(state) {
  isBadEnvActive = Boolean(state);
  logger.warn({ isBadEnvActive }, 'Bad environment variable chaos state updated');
}

function getBadEnvStatus() {
  return isBadEnvActive;
}

function checkBadEnvChaos() {
  if (isBadEnvActive) {
    const err = new Error('INVALID_ENV_VAR: Misconfigured database port or credential');
    err.code = 'ERR_INVALID_ENV';
    throw err;
  }
}

module.exports = {
  setBadEnv,
  getBadEnvStatus,
  checkBadEnvChaos,
};
