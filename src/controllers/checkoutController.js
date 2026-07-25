const checkoutService = require('../services/checkoutService');

async function createSession(req, res, next) {
  try {
    const { customerId, items } = req.body;
    const session = await checkoutService.createCheckoutSession(customerId, items);
    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const session = await checkoutService.getCheckoutSession(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: { message: 'Checkout session not found', code: 'SESSION_NOT_FOUND', statusCode: 404 } });
    }
    res.json({ session });
  } catch (err) {
    next(err);
  }
}

async function processOrder(req, res, next) {
  try {
    const { sessionId } = req.params;
    const order = await checkoutService.processCheckout(sessionId);
    res.status(200).json({ order });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createSession,
  getSession,
  processOrder,
};
