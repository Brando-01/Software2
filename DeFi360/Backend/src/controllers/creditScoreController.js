const CreditScoreService = require('../services/CreditScoreService');

const defaultCreditScoreService = new CreditScoreService();

/**

 * @param {CreditScoreService} creditScoreService 
 * @returns {Function} 
 */
const getCreditScore = (creditScoreService = defaultCreditScoreService) => async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ 
        success: false,
        message: 'Se requiere el ID del usuario' 
      });
    }

    const userId = parseInt(req.params.id, 10);
    if (Number.isNaN(userId) || userId <= 0) {
      return res.status(400).json({ 
        success: false,
        message: 'ID de usuario inválido' 
      });
    }

    const result = await creditScoreService.getScore(userId);
    
    res.json({ 
      success: true, 
      ...result 
    });
    
  } catch (error) {
    console.error('[getCreditScore] Error:', {
      message: error.message,
      stack: error.stack,
      userId: req.params.id
    });

    if (error.message === 'userId is required') {
      return res.status(400).json({ 
        success: false,
        message: 'ID de usuario requerido' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error al calcular el score crediticio' 
    });
  }
};

module.exports = {
  getCreditScore: getCreditScore(),
  
  createCreditScoreHandler: getCreditScore,
  
  defaultCreditScoreService,
  

  _factories: { 
    getCreditScore 
  }
};