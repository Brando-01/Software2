const express = require('express');
const { calculateLTV, requestLoan, getUserLoans, matchLoan } = require('../controllers/loanController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/calculate-ltv', calculateLTV);
router.post('/request', protect, requestLoan);
router.get('/my-loans', protect, getUserLoans);
router.post('/match/:id', protect, matchLoan);

module.exports = router;