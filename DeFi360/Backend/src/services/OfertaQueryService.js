const { Op } = require('sequelize');

class OfertaQueryService {
    buildWhereClause({ type, minAmount, maxAmount, minApy, maxApy }) {
        const where = { status: 'active' };

        if (type === 'lend' || type === 'borrow') {
            where.type = type;
        }

        if (minAmount) {
            where.amount = { [Op.gte]: parseFloat(minAmount) };
        }

        if (maxAmount) {
            where.amount = { ...where.amount, [Op.lte]: parseFloat(maxAmount) };
        }

        if (minApy) {
            where.apy = { [Op.gte]: parseFloat(minApy) };
        }

        if (maxApy) {
            where.apy = { ...where.apy, [Op.lte]: parseFloat(maxApy) };
        }

        return where;
    }
}

module.exports = OfertaQueryService;