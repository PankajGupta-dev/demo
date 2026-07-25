const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/healthz', healthController.liveness);
router.get('/readyz', healthController.readiness);

module.exports = router;
