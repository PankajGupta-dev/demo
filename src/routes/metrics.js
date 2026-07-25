const express = require('express');

const router = express.Router();

const metrics = {
  httpRequestsTotal: 0,
  ordersProcessedTotal: 0,
  checkoutFailuresTotal: 0,
  cartSessionsCreatedTotal: 0,
  startTime: new Date().toISOString(),
};

function incrementMetric(key) {
  if (typeof metrics[key] === 'number') {
    metrics[key] += 1;
  }
}

router.use((req, res, next) => {
  incrementMetric('httpRequestsTotal');
  next();
});

router.get('/', (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - new Date(metrics.startTime).getTime()) / 1000);

  res.json({
    metrics: {
      http_requests_total: metrics.httpRequestsTotal,
      orders_processed_total: metrics.ordersProcessedTotal,
      checkout_failures_total: metrics.checkoutFailuresTotal,
      cart_sessions_created_total: metrics.cartSessionsCreatedTotal,
      uptime_seconds: uptimeSeconds,
    },
  });
});

module.exports = {
  router,
  incrementMetric,
};
