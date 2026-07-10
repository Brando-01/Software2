const ILoanState = require('./ILoanState');

// Aplicacion de la interfaz para el estado LIQUIDATED
class LiquidatedState extends ILoanState {
  get name() {
    return 'LIQUIDATED';
  }

  canLiquidate() {
    return false;
  }

  next() {
    return this;
  }
}

module.exports = LiquidatedState;
