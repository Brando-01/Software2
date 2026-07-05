const ICommand = require('./ICommand');

// Clase que representa el comando de liquidación de un préstamo. Implementa la interfaz ICommand y encapsula la lógica para ejecutar la liquidación de un préstamo específico utilizando un servicio proporcionado.

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
