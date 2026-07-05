const ILoanState = require('./ILoanState');

class ActiveState extends ILoanState {
  get name() {
    // Esto va a retornar el nombre del estado actual, que es 'ACTIVE'.
    return 'ACTIVE';
  }

  canLiquidate() {
    // Esto va a retornar true, indicando que el préstamo puede ser liquidado en este estado.
    return true;
  }

  next() {
    const LiquidatingState = require('./LiquidatingState');
    return new LiquidatingState();
  }
}

module.exports = ActiveState;
