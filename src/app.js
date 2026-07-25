const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const healthRoutes = require('./routes/healthRoutes');
const apiRoutes = require('./routes/index');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check endpoints mounted at root
app.use('/', healthRoutes);

// Application API routes mounted under /api
app.use('/api', apiRoutes);

// 404 Route Handler
app.use((req, res, next) => {
  const err = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  err.statusCode = 404;
  err.code = 'NOT_FOUND';
  next(err);
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
