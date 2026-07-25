const express = require('express');
const productRoutes = require('./productRoutes');
const checkoutRoutes = require('./checkoutRoutes');
const orderRoutes = require('./orderRoutes');

const router = express.Router();

router.use('/products', productRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', orderRoutes);

module.exports = router;
