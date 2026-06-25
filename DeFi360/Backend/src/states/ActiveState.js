const ILoanState = require('./ILoanState');

class ActiveState extends ILoanState {
  get name() {
    return 'ACTIVE';
  }

  canLiquidate() {
    return true;
  }

  next() {
    const LiquidatingState = require('./LiquidatingState');
    return new LiquidatingState();
  }
}

module.exports = ActiveState;
