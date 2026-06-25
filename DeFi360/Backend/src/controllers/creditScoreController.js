const CreditScoreService = require('../services/CreditScoreService');

const  defaultCreditScoreService = new CreditScoreService();

const getCreditScore = (creditScoreService = defaultCreditScoreService) => async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId)) {

      return res.status(400).json({ message: 'id de usuario inválido' });
    }

    const result = await creditScoreService.getScore(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[getCreditScore]', error.message);
    res.status(500).json({ message: 'Error al calcular el score crediticio' });
  }
};

module.exports = {
  getCreditScore: getCreditScore(),
  _factories: { getCreditScore }



};
