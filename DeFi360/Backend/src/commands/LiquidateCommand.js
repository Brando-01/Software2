const ICommand = require('./ICommand');

class LiquidateCommand extends ICommand {
    constructor(loan, service, context = {}) {
    super();
    this.loan = loan;
    this.service = service;
    this.context = context;
  }

  async execute() {
    return this.service.performLiquidation(this.loan, this.context);
  }
}

module.exports = LiquidateCommand;
