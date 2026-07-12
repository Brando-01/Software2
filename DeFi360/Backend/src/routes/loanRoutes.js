const express = require('express');
const {
  calculateLTV, requestLoan, getUserLoans, matchLoan, payLoan, simulate,
  liquidate, getLiquidation
} = require('../controllers/loanController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/calculate-ltv', calculateLTV);
router.post('/simulate', simulate);
router.post('/request', protect, requestLoan);
router.get('/my-loans', protect, getUserLoans);
router.post('/match/:id', protect, matchLoan);
router.post('/:id/pay', protect, payLoan);

// Se implementas las rutas para la liquidación de préstamos con su proteccion respectiva

router.post('/:id/liquidate', protect, authorize('admin'), liquidate);
router.get('/:id/liquidation', protect, getLiquidation);

module.exports = router;
