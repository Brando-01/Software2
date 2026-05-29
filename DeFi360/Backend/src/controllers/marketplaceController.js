const { Offer, User, Wallet } = require('../models');
const { Op } = require('sequelize');
const SimulatedOracleAdapter = require('../services/SimulatedOracleAdapter');

// Instancia por defecto del precio oracle
const defaultPriceOracle = new SimulatedOracleAdapter();

/**
 * Obtener todas las ofertas activas con cálculo de LTV enriquecido
 * SOLID: DIP - El controlador depende de IPriceOracle inyectado
 * 
 * @param {IPriceOracle} priceOracle - Oracle de precios inyectado
 */
const getOffers = (priceOracle = defaultPriceOracle) => async (req, res) => {
  try {
    const whereClause = ofertaQueryService.buildWhereClause(req.query);

    const offers = await Offer.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ['id', 'walletAddress', 'name'] }],
      order: [['createdAt', 'DESC']]
    });

    // Enriquecer ofertas con información de precio de colateral
    const enrichedOffers = await Promise.all(
      offers.map(async (offer) => {
        const offerData = offer.toJSON();

        if (offer.collateralType && offer.collateralAmount) {
          try {
            const collateralPrice = await priceOracle.getPrice(offer.collateralType);
            offerData.collateralPrice = collateralPrice;
            offerData.collateralValueUSD = (offer.collateralAmount * collateralPrice).toFixed(2);
            offerData.ltv = ((offer.amount / (offer.collateralAmount * collateralPrice)) * 100).toFixed(2);
          } catch (error) {
            console.warn(`No se pudo obtener precio para ${offer.collateralType}:`, error.message);
          }
        }

        return offerData;
      })
    );

    res.json({ success: true, count: enrichedOffers.length, offers: enrichedOffers });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener ofertas' });
  }
};

// @desc    Crear oferta (Lend o Borrow)
// @route   POST /api/marketplace/offers
const createOffer = (priceOracle = defaultPriceOracle) => async (req, res) => {
  try {
    const { type, amount, apy, duration, collateralType, collateralAmount } = req.body;

    if (!type || !amount || !apy || !duration) {
      return res.status(400).json({
        message: 'Faltan campos requeridos: type, amount, apy, duration',
        received: { type, amount, apy, duration }
      });
    }

    const userId = req.user.id;
    const wallet = await Wallet.findOne({ where: { userId } });

    if (!wallet) {
      return res.status(400).json({
        message: 'No se encontró wallet del usuario',
        userId
      });
    }

    if (type === 'lend') {
      const availableBalance = parseFloat(wallet.availableBalance);
      const requestedAmount = parseFloat(amount);

      if (requestedAmount > availableBalance) {
        return res.status(400).json({
          message: 'Saldo insuficiente para ofrecer préstamo',
          details: {
            requested: requestedAmount,
            available: availableBalance,
            deficit: (requestedAmount - availableBalance).toFixed(2)
          }
        });
      }

      await wallet.update({
        availableBalance: availableBalance - requestedAmount,
        blockedBalance: parseFloat(wallet.blockedBalance) + requestedAmount
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

    // Enriquecer respuesta con precio del colateral
    const offerData = offer.toJSON();
    if (collateralType && collateralAmount) {
      try {
        const collateralPrice = await priceOracle.getPrice(collateralType);
        offerData.collateralPrice = collateralPrice;
        offerData.collateralValueUSD = (collateralAmount * collateralPrice).toFixed(2);
      } catch (error) {
        console.warn(`No se pudo obtener precio para ${collateralType}:`, error.message);
      }
    }

    res.status(201).json({ success: true, offer: offerData });
  } catch (error) {
    console.error('[createOffer] Error:', error.message, error);
    res.status(500).json({ message: 'Error al crear oferta', error: error.message });
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

module.exports = {
  getOffers: getOffers(),
  createOffer: createOffer(),
  cancelOffer
};