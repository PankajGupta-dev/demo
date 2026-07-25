const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code: err.code,
      },
      request: {
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query,
      },
    },
    'Unhandled application error processed by errorHandler'
  );

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message,
      code: err.code || 'INTERNAL_SERVER_ERROR',
      statusCode,
    },
  });
}

module.exports = errorHandler;
