class ILedgerRepository {
    async record(userId, type, amount, refType, refId) {
    throw new Error('ILedgerRepository.record() debe ser implementado');
  }

    async getEntries(userId, page, size) {
    throw new Error('ILedgerRepository.getEntries() debe ser implementado');
  }

    async getStatement(userId) {
    throw new Error('ILedgerRepository.getStatement() debe ser implementado');
  }
}

module.exports = ILedgerRepository;
