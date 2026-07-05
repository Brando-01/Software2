const ILoanState = require('./ILoanState');

// Aqui tambien aplicamos la interfaz para el segundo estado LIQUIDATING

class LiquidatingState extends ILoanState {
  get name() {
    return 'LIQUIDATING';
  }

  canLiquidate() {
    return false;
  }

  next() {
    const LiquidatedState = require('./LiquidatedState');
    return new LiquidatedState();
  }
}

module.exports = LiquidatingState;
