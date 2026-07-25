const orderService = require('../services/orderService');

async function getOrder(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Order not found', code: 'ORDER_NOT_FOUND', statusCode: 404 } });
    }
    res.json({ order });
  } catch (err) {
    next(err);
  }
}

async function getCustomerOrders(req, res, next) {
  try {
    const orders = await orderService.getOrdersByCustomer(req.params.customerId);
    res.json({ orders });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getOrder,
  getCustomerOrders,
};
