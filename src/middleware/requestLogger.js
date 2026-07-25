const pinoHttp = require('pino-http');
const logger = require('../utils/logger');

const requestLogger = pinoHttp({
  logger,
  customLogLevel(req, res, err) {
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 400) {
      return 'warn';
    }
    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} completed with ${res.statusCode}`;
  },
  customErrorMessage(req, res, err) {
    return `${req.method} ${req.url} failed with ${res.statusCode}: ${err.message}`;
  },
});

module.exports = requestLogger;
