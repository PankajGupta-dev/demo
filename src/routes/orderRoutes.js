const express = require('express');
const orderController = require('../controllers/orderController');

const router = express.Router();

router.get('/:id', orderController.getOrder);
router.get('/customer/:customerId', orderController.getCustomerOrders);

module.exports = router;
