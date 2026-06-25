const ILoanState = require('./ILoanState');

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
