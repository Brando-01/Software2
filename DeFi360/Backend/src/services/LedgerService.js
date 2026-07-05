const ILedgerRepository = require('../interfaces/ILedgerRepository');
const { LedgerEntry } = require('../models');

class LedgerService extends ILedgerRepository {
  constructor(model = LedgerEntry) {
    super();
    this.model = model;
  }

    async record(userId, type, amount, refType = null, refId = null) {
    const value = parseFloat(amount);
    if (Number.isNaN(value)) {
      throw new Error('El monto del asiento debe ser numérico');
    }

    const last = await this.model.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    const previousBalance = last ? parseFloat(last.balanceAfter) : 0;
    const balanceAfter = parseFloat((previousBalance + this._signedAmount(type, value)).toFixed(2));

    return this.model.create({
      userId,
      type,
      amount: value,
      balanceAfter,
      refType,
      refId
    });
  }

    _signedAmount(type, value) {
    const credits = ['DISBURSEMENT', 'PAYMENT', 'RELEASE'];
    return credits.includes(type) ? value : -value;
  }

    async getEntries(userId, page = 1, size = 20) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const sizeNum = Math.max(1, parseInt(size, 10) || 20);
    const offset = (pageNum - 1) * sizeNum;

    const { rows, count } = await this.model.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: sizeNum,
      offset
    });

    return {
      entries: rows,
      pagination: {
        total: count,
        page: pageNum,
        size: sizeNum,
        totalPages: Math.ceil(count / sizeNum)
      }
    };
  }

    async getStatement(userId) {
    const entries = await this.model.findAll({
      where: { userId },
      order: [['createdAt', 'ASC']]
    });

    const totals = {
      totalDisbursed: 0,
      totalPaid: 0,
      totalLiquidated: 0,
      totalReleased: 0,
      totalLocked: 0
    };

    const mapping = {
      DISBURSEMENT: 'totalDisbursed',
      PAYMENT: 'totalPaid',
      LIQUIDATION: 'totalLiquidated',
      RELEASE: 'totalReleased',
      LOCK: 'totalLocked'
    };

    for (const entry of entries) {
      const bucket = mapping[entry.type];
      if (bucket) {
        totals[bucket] += parseFloat(entry.amount);
      }
    }

    const balance = entries.length > 0
      ? parseFloat(entries[entries.length - 1].balanceAfter)
      : 0;

    Object.keys(totals).forEach((k) => {
      totals[k] = parseFloat(totals[k].toFixed(2));
    });

    return {
      userId,
      ...totals,
      balance: parseFloat(balance.toFixed(2)),
      entryCount: entries.length
    };
  }
}

module.exports = LedgerService;
