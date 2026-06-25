const ILoanState = require('./ILoanState');

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
