const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { logger, httpLogger } = require('./middleware/logger');
const { initPostgres, pool } = require('./db/postgres');
const { redisClient } = require('./db/redis');
const { seedProducts } = require('./db/seed');

const productsRouter = require('./routes/products');
const cartRouter = require('./routes/cart');
const checkoutRouter = require('./routes/checkout');
const healthRouter = require('./routes/health');
const { router: metricsRouter } = require('./routes/metrics');
const adminRouter = require('./routes/admin');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 8080;

const path = require('path');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(httpLogger);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Mount router endpoints
app.use('/health', healthRouter);
app.use('/healthz', healthRouter);
app.use('/metrics', metricsRouter);
app.use('/products', productsRouter);
app.use('/cart', cartRouter);
app.use('/checkout', checkoutRouter);
app.use('/admin', adminRouter);

// 404 Fallback
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  logger.error({ err, url: req.originalUrl, method: req.method }, 'Application error handled');
  
  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR',
    },
  });
});

let server;

async function start() {
  try {
    logger.info('Initializing OpsForge Demo Checkout Backend Service...');
    
    await initPostgres();
    await seedProducts();
    
    try {
      await redisClient.connect();
    } catch (redisErr) {
      logger.warn({ redisErr }, 'Initial Redis connection deferred to retry strategy');
    }

    server = app.listen(PORT, () => {
      logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, `Checkout service online and listening on port ${PORT}`);
    });
  } catch (err) {
    logger.fatal({ err }, 'Fatal error during server startup');
    process.exit(1);
  }
}

async function shutdown(signal) {
  logger.info({ signal }, `Received ${signal}. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');
      try {
        await pool.end();
        logger.info('PostgreSQL pool ended');
      } catch (err) {
        logger.error({ err }, 'Error ending PostgreSQL pool');
      }
      try {
        await redisClient.quit();
        logger.info('Redis client disconnected');
      } catch (err) {
        logger.error({ err }, 'Error disconnecting Redis client');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection detected');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught Exception thrown');
  process.exit(1);
});

start();
