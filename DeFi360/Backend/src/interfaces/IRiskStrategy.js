class IRiskStrategy {
    evaluate(loanAmount, collateralValue) {
        throw new Error('IRiskStrategy.evaluate() debe ser implementado');
    }
}

module.exports = IRiskStrategy;
