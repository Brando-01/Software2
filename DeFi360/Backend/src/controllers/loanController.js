const { Loan, Offer, Wallet, User } = require('../models');
const { Op } = require('sequelize');

// @desc    Calcular LTV
// @route   POST /api/loans/calculate-ltv
const calculateLTV = async (req, res) => {
  try {
    const { loanAmount, collateralAmount, collateralPrice = 3000 } = req.body;
    
    const collateralValue = collateralAmount * collateralPrice;
    const ltv = (loanAmount / collateralValue) * 100;
    
    let riskLevel = 'low';
    if (ltv > 80) riskLevel = 'critical';
    else if (ltv > 70) riskLevel = 'high';
    else if (ltv > 50) riskLevel = 'medium';
    
    res.json({
      loanAmount,
      collateralValue,
      ltv: ltv.toFixed(2),
      riskLevel,
      isHealthy: ltv <= 80,
      message: ltv > 80 ? '⚠️ LTV alto. Riesgo de liquidación.' : '✅ LTV aceptable.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al calcular LTV' });
  }
};

// @desc    Solicitar préstamo (crear solicitud)
// @route   POST /api/loans/request
const requestLoan = async (req, res) => {
  try {
    const { amount, duration, collateralType, collateralAmount } = req.body;
    
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ where: { userId } });
    
    // Verificar saldo para colateral (simulación)
    if (parseFloat(collateralAmount) * 3000 < parseFloat(amount)) {
      return res.status(400).json({ message: 'Colateral insuficiente para el monto solicitado' });
    }
    
    // Crear oferta de tipo borrow
    const offer = await Offer.create({
      userId,
      type: 'borrow',
      amount,
      apy: 5.0, // Tasa por defecto
      duration,
      collateralType,
      collateralAmount,
      status: 'active'
    });
    
    res.status(201).json({ success: true, offer, message: 'Solicitud de préstamo publicada en el Marketplace' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al solicitar préstamo' });
  }
};

// @desc    Obtener préstamos del usuario
// @route   GET /api/loans/my-loans
const getUserLoans = async (req, res) => {
  try {
    const loansAsLender = await Loan.findAll({
      where: { lenderId: req.user.id },
      include: [
        { model: User, as: 'Borrower', attributes: ['walletAddress', 'name'] },
        { model: Offer }
      ]
    });
    
    const loansAsBorrower = await Loan.findAll({
      where: { borrowerId: req.user.id },
      include: [
        { model: User, as: 'Lender', attributes: ['walletAddress', 'name'] },
        { model: Offer }
      ]
    });
    
    res.json({
      asLender: loansAsLender,
      asBorrower: loansAsBorrower
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener préstamos' });
  }
};

// @desc    Simular match de préstamo (emparejamiento automático)
// @route   POST /api/loans/match/:offerId
const matchLoan = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    
    if (!offer || offer.status !== 'active') {
      return res.status(404).json({ message: 'Oferta no disponible' });
    }
    
    if (offer.userId === req.user.id) {
      return res.status(400).json({ message: 'No puedes aceptar tu propia oferta' });
    }
    
    const lenderWallet = await Wallet.findOne({ where: { userId: req.user.id } });
    
    if (offer.type === 'borrow') {
      // El usuario actual es prestamista
      if (parseFloat(offer.amount) > parseFloat(lenderWallet.availableBalance)) {
        return res.status(400).json({ message: 'Saldo insuficiente para prestar' });
      }
      
      // Crear préstamo
      const loan = await Loan.create({
        lenderId: req.user.id,
        borrowerId: offer.userId,
        offerId: offer.id,
        amount: offer.amount,
        apy: offer.apy,
        duration: offer.duration,
        ltv: offer.collateralAmount ? (offer.amount / (offer.collateralAmount * 3000) * 100).toFixed(2) : null,
        remainingBalance: offer.amount,
        status: 'active',
        endDate: new Date(Date.now() + offer.duration * 24 * 60 * 60 * 1000)
      });
      
      // Actualizar wallets
      await lenderWallet.update({
        availableBalance: lenderWallet.availableBalance - parseFloat(offer.amount),
        blockedBalance: lenderWallet.blockedBalance + parseFloat(offer.amount)
      });
      
      const borrowerWallet = await Wallet.findOne({ where: { userId: offer.userId } });
      await borrowerWallet.update({
        availableBalance: borrowerWallet.availableBalance + parseFloat(offer.amount)
      });
      
      // Actualizar estado de la oferta
      await offer.update({ status: 'matched', matchedWith: req.user.id });
      
      res.json({ success: true, loan });
    } else {
      res.status(400).json({ message: 'Tipo de oferta no soportada para match' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al procesar match' });
  }
};

module.exports = { calculateLTV, requestLoan, getUserLoans, matchLoan };