class ICreditScoringStrategy {
    score(history) {
    throw new Error('ICreditScoringStrategy.score() debe ser implementado');
  }
}

module.exports = ICreditScoringStrategy;
