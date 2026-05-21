const { Offer, User, Wallet } = require('../models');
const { Op } = require('sequelize');

// @desc    Obtener todas las ofertas activas
// @route   GET /api/marketplace/offers
const getOffers = async (req, res) => {
  try {
    const { type, minAmount, maxAmount, minApy, maxApy } = req.query;
    
    let whereClause = { status: 'active' };
    
    if (type && ['lend', 'borrow'].includes(type)) {
      whereClause.type = type;
    }
    
    if (minAmount) {
      whereClause.amount = { [Op.gte]: parseFloat(minAmount) };
    }
    
    if (maxAmount) {
      whereClause.amount = { ...whereClause.amount, [Op.lte]: parseFloat(maxAmount) };
    }
    
    if (minApy) {
      whereClause.apy = { [Op.gte]: parseFloat(minApy) };
    }
    
    if (maxApy) {
      whereClause.apy = { ...whereClause.apy, [Op.lte]: parseFloat(maxApy) };
    }
    
    const offers = await Offer.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'walletAddress', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, count: offers.length, offers });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ofertas' });
  }
};

// @desc    Crear oferta (Lend o Borrow)
// @route   POST /api/marketplace/offers
const createOffer = async (req, res) => {
  try {
    const { type, amount, apy, duration, collateralType, collateralAmount } = req.body;
    
    // Validaciones básicas
    if (!type || !amount || !apy || !duration) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    
    const userId = req.user.id;
    const wallet = await Wallet.findOne({ where: { userId } });
    
    if (type === 'lend') {
      if (parseFloat(amount) > parseFloat(wallet.availableBalance)) {
        return res.status(400).json({ message: 'Saldo insuficiente para ofrecer préstamo' });
      }
      
      // Bloquear fondos
      await wallet.update({
        availableBalance: wallet.availableBalance - parseFloat(amount),
        blockedBalance: wallet.blockedBalance + parseFloat(amount)
      });
    }
    
    const offer = await Offer.create({
      userId,
      type,
      amount,
      apy,
      duration,
      collateralType,
      collateralAmount: collateralAmount || null,
      status: 'active'
    });
    
    res.status(201).json({ success: true, offer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear oferta' });
  }
};

// @desc    Cancelar oferta
// @route   DELETE /api/marketplace/offers/:id
const cancelOffer = async (req, res) => {
  try {
    const offer = await Offer.findByPk(req.params.id);
    
    if (!offer) {
      return res.status(404).json({ message: 'Oferta no encontrada' });
    }
    
    if (offer.userId !== req.user.id) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    if (offer.status !== 'active') {
      return res.status(400).json({ message: 'La oferta ya no está activa' });
    }
    
    if (offer.type === 'lend') {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      await wallet.update({
        availableBalance: wallet.availableBalance + parseFloat(offer.amount),
        blockedBalance: wallet.blockedBalance - parseFloat(offer.amount)
      });
    }
    
    await offer.update({ status: 'cancelled' });
    
    res.json({ success: true, message: 'Oferta cancelada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar oferta' });
  }
};

module.exports = { getOffers, createOffer, cancelOffer };