const express = require('express');
const { getCreditScore } = require('../controllers/creditScoreController');
const { updateRole } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/:id/credit-score', protect, getCreditScore);

router.patch('/:id/role', protect, authorize('admin'), updateRole);

module.exports = router;
