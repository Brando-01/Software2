*/Creacion de Libro Mayor/*

const LedgerService = require('../services/LedgerService');

const defaultLedgerService = new LedgerService();

const getLedger = (ledgerService = defaultLedgerService) => async (req, res) => {
  try {
    const { page = 1, size = 20 } = req.query;
    const result = await ledgerService.getEntries(req.user.id, page, size);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('[getLedger]', error.message);
    res.status(500).json({ message: 'Error al obtener el libro mayor' });
  }
};

const getStatement = (ledgerService = defaultLedgerService) => async (req, res) => {
  try {
    const statement = await ledgerService.getStatement(req.user.id);
    res.json({ success: true, statement });
  } catch (error) {
    console.error('[getStatement]', error.message);
    res.status(500).json({ message: 'Error al obtener el estado de cuenta' });
  }
};

module.exports = {
  getLedger: getLedger(),
  getStatement: getStatement(),
  _factories: { getLedger, getStatement }
};
