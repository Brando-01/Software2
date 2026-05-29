const IRiskStrategy = require('../interfaces/IRiskStrategy');

class MockRiskStrategy extends IRiskStrategy {

    constructor(forcedLevel = IRiskStrategy.RiskLevel.NORMAL) {
        super();
        const validLevels = Object.values(IRiskStrategy.RiskLevel);
        if (!validLevels.includes(forcedLevel)) {
            throw new Error(
                `MockRiskStrategy: nivel inválido "${forcedLevel}". ` +
                `Válidos: ${validLevels.join(', ')}`
            );
        }
        this.forcedLevel = forcedLevel;
        this.callCount = 0;
        this.lastLoan = null;
    }

    evaluate(loan, currentPrice) {
        this.callCount++;
        this.lastLoan = loan;
        return this.forcedLevel;
    }

    reset() {
        this.callCount = 0;
        this.lastLoan = null;
    }
}

module.exports = MockRiskStrategy;

