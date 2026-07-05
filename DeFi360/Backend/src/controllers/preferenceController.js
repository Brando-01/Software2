const { LenderPreference } = require('../models');

const savePreferences = (model = LenderPreference) => async (req, res) => {
  try {
    const lenderId = req.user.id;
    const {
      maxAmount, minApy, collateralTypes, maxLtv, minCreditScore, autoMatch
    } = req.body;

    const payload = {
      lenderId,
      maxAmount: maxAmount ?? null,
      minApy: minApy ?? null,
      collateralTypes: collateralTypes ?? null,
      maxLtv: maxLtv ?? null,
      minCreditScore: minCreditScore ?? null,
      autoMatch: autoMatch ?? false
    };

    const existing = await model.findOne({ where: { lenderId } });
    let preference;
    if (existing) {
      preference = await existing.update(payload);
    } else {
      preference = await model.create(payload);
    }

    res.status(201).json({ success: true, preference });
  } catch (error) {
    console.error('[savePreferences]', error.message);
    res.status(500).json({ message: 'Error al guardar preferencias' });
  }
};

const getPreferences = (model = LenderPreference) => async (req, res) => {
  try {
    const preference = await model.findOne({ where: { lenderId: req.user.id } });
    res.json({ success: true, preference });
  } catch (error) {
    console.error('[getPreferences]', error.message);
    res.status(500).json({ message: 'Error al obtener preferencias' });
  }
};

module.exports = {
  savePreferences: savePreferences(),
  getPreferences: getPreferences(),
  _factories: { savePreferences, getPreferences }
};
