const ILoanState = require('./ILoanState');

// Aqui tambien aplicamos la interfaz para el segundo estado LIQUIDATING, necesario para verificar que un prestamo no pueda ser liquidado mientras se encuentra en proceso de liquidación.

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
