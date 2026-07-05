const ILoanState = require('./ILoanState');

// Aplicacion de la interfaz para el estado LIQUIDATED, que representa un préstamo que ya ha sido liquidado y no puede ser liquidado nuevamente.

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
