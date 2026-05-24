const { Offer, User, Wallet } = require('../models');
const OfertaQueryService = require('../services/OfertaQueryService');

const ofertaQueryService = new OfertaQueryService();

const getOffers = async (req, res) => {
  try {
    const whereClause = ofertaQueryService.buildWhereClause(req.query);

    const offers = await Offer.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'walletAddress', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, count: offers.length, offers });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ofertas' });
  }
};

const createOffer = async (req, res) => {
  try {
    const { type, amount, apy, duration, collateralType, collateralAmount } = req.body;

    if (!type || !amount || !apy || !duration) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }

    const userId = req.user.id;
    const wallet = await Wallet.findOne({ where: { userId } });

    if (type === 'lend') {
      if (parseFloat(amount) > parseFloat(wallet.availableBalance)) {
        return res.status(400).json({ message: 'Saldo insuficiente para ofrecer préstamo' });
      }

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