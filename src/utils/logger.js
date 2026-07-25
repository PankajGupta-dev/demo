const pino = require('pino');
const config = require('../config/env');

const logger = pino({
  level: config.logLevel,
  base: {
    service: 'opsforge-demo-checkout',
    env: config.env,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

module.exports = logger;
