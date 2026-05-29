class IRiskStrategy {
    evaluate(loan, currentPrice) {
        throw new Error('IRiskStrategy.evaluate() debe ser implementado por la subclase');
    }
}

IRiskStrategy.RiskLevel = Object.freeze({
    NORMAL: 'NORMAL',
    RIESGO_MODERADO: 'RIESGO_MODERADO',
    RIESGO_ALTO: 'RIESGO_ALTO',
    LIQUIDACION_INMINENTE: 'LIQUIDACION_INMINENTE',
});

module.exports = IRiskStrategy;
