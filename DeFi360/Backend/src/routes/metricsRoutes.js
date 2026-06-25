const express = require('express');
const { health, ready, metrics } = require('../controllers/metricsController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/health', health);
router.get('/ready', ready);
router.get('/metrics', protect, authorize('admin'), metrics);

module.exports = router;
