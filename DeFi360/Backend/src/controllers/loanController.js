const { Offer, Wallet, User } = require('../models');
const LoanFactory = require('../factories/LoanFactory');
const LTVRiskStrategy = require('../strategies/LTVRiskStrategy');
const CollateralService = require('../services/CollateralService');
const StandardPaymentProcessor = require('../services/StandardPaymentProcessor');

const defaultLoanFactory = new LoanFactory();
const defaultRiskStrategy = new LTVRiskStrategy();
const defaultCollateralService = new CollateralService();

// ============ FUNCIONES ============

const calculateLTV = (riskStrategy = defaultRiskStrategy, collateralService = defaultCollateralService) => async (req, res) => {
  try {
    const { loanAmount, collateralAmount, collateralType = 'ETH' } = req.body;

    const collateralValue = await collateralService.calculateValue(
      collateralType,
      collateralAmount
    );

    const { ratio, riskLevel, isHealthy, message } = riskStrategy.evaluate(
      parseFloat(loanAmount),
      collateralValue
    );

    res.json({
      loanAmount,
      collateralValue,
      ltv: ratio,
      riskLevel,
      isHealthy,
      message
    });
  } catch (error) {
    console.error('[calculateLTV]', error.message);
    res.status(500).json({ message: 'Error al calcular LTV' });
  }
};

const requestLoan = (collateralService = defaultCollateralService) => async (req, res) => {
  try {
    const { amount, duration, collateralType = 'ETH', collateralAmount } = req.body;
    const userId = req.user.id;

    // Validar datos requeridos
    if (!amount || !duration) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: amount y duration',
        received: { amount, duration, collateralType, collateralAmount }
      });
    }

    // Validar que collateralAmount sea un número
    if (!collateralAmount || isNaN(parseFloat(collateralAmount))) {
      return res.status(400).json({
        message: 'collateralAmount debe ser un número válido',
        received: { collateralAmount }
      });
    }

    const sufficient = await collateralService.isSufficient(
      amount,
      collateralType,
      collateralAmount
    );

    if (!sufficient) {
      const collateralValue = await collateralService.calculateValue(collateralType, collateralAmount);
      return res.status(400).json({
        message: 'Colateral insuficiente para el monto solicitado',
        details: {
          requestedAmount: amount,
          collateralValue: collateralValue,
          minRequired: amount,
          ltv: ((amount / collateralValue) * 100).toFixed(2) + '%'
        }
      });
    }

    const offer = await Offer.create({
      userId,
      type: 'borrow',
      amount,
      apy: 5.0,
      duration,
      collateralType,
      collateralAmount,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      offer,
      message: 'Solicitud de préstamo publicada en el Marketplace'
    });
  } catch (error) {
    console.error('[requestLoan] Error:', error.message, error);
    res.status(500).json({ message: 'Error al solicitar préstamo', error: error.message });
  }
};

const getUserLoans = async (req, res) => {
  try {
    const { Loan } = require('../models');

    const [asLender, asBorrower] = await Promise.all([
      Loan.findAll({
        where: { lenderId: req.user.id },
        include: [
          { model: User, as: 'Borrower', attributes: ['walletAddress', 'name'] },
          { model: Offer }
        ]
      }),
      Loan.findAll({
        where: { borrowerId: req.user.id },
        include: [
          { model: User, as: 'Lender', attributes: ['walletAddress', 'name'] },
          { model: Offer }
        ]
      })
    ]);

    res.json({ asLender, asBorrower });
  } catch (error) {
    console.error('[getUserLoans]', error.message);
    res.status(500).json({ message: 'Error al obtener préstamos' });
  }
};

const matchLoan = (loanFactory = defaultLoanFactory) => async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);

    if (!offer || offer.status !== 'active') {
      return res.status(404).json({ message: 'Oferta no disponible' });
    }

    if (offer.userId === req.user.id) {
      return res.status(400).json({ message: 'No puedes aceptar tu propia oferta' });
    }

    const lenderWallet = await Wallet.findOne({ where: { userId: req.user.id } });

    if (offer.type !== 'borrow') {
      return res.status(400).json({ message: 'Tipo de oferta no soportada para match' });
    }

    if (parseFloat(offer.amount) > parseFloat(lenderWallet.availableBalance)) {
      return res.status(400).json({ message: 'Saldo insuficiente para prestar' });
    }

    // Permitir especificar el tipo de tasa en el request body, por defecto 'fixed'
    const { rateType = 'fixed' } = req.body;

    const loan = await loanFactory.createFromOffer(offer, req.user.id, offer.userId, rateType);

    const borrowerWallet = await Wallet.findOne({ where: { userId: offer.userId } });

    await Promise.all([
      lenderWallet.update({
        availableBalance: lenderWallet.availableBalance - parseFloat(offer.amount),
        blockedBalance: lenderWallet.blockedBalance + parseFloat(offer.amount)
      }),
      borrowerWallet.update({
        availableBalance: borrowerWallet.availableBalance + parseFloat(offer.amount)
      }),
      offer.update({ status: 'matched', matchedWith: req.user.id })
    ]);

    res.json({ 
      success: true, 
      loan,
      rateType: loan.rateType,
      message: `Préstamo creado con tasa ${loan.rateType}`
    });
  } catch (error) {
    console.error('[matchLoan]', error.message);
    res.status(500).json({ message: 'Error al procesar match' });
  }
};

const payLoan = async (req, res) => {
  try {
    const { Loan } = require('../models');
    const { amount } = req.body;
    const loanId = parseInt(req.params.id);

    const paymentProcessor = new StandardPaymentProcessor();

    const loan = await Loan.findByPk(loanId);
    if (!loan) {
      return res.status(404).json({ message: 'Préstamo no encontrado' });
    }

    if (loan.borrowerId !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado para pagar este préstamo' });
    }

    const result = await paymentProcessor.processPayment({
      loanId,
      amount,
      borrowerId: loan.borrowerId,
      lenderId: loan.lenderId
    });

    res.json({
      success: true,
      message: result.loanStatus === 'paid'
        ? '✅ Préstamo pagado completamente'
        : `✅ Pago procesado. Saldo restante: ${result.newRemainingBalance}`,
      ...result
    });

  } catch (error) {
    console.error('Error en payLoan:', error.message);
    res.status(400).json({ message: error.message || 'Error al procesar pago' });
  }
};

// ============ ✅ EXPORTS CORREGIDOS ============
module.exports = {
  calculateLTV: calculateLTV(),
  requestLoan: requestLoan(),
  getUserLoans,
  matchLoan: matchLoan(),
  payLoan
};