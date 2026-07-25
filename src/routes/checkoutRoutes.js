const express = require('express');
const checkoutController = require('../controllers/checkoutController');

const router = express.Router();

router.post('/sessions', checkoutController.createSession);
router.get('/sessions/:sessionId', checkoutController.getSession);
router.post('/sessions/:sessionId/process', checkoutController.processOrder);

module.exports = router;
