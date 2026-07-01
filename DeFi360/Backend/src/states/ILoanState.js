class ILoanState {
  get name() {
    throw new Error('ILoanState.name debe ser implementado'); // Aca fijamos la interfaz con sus respectivos metodos
  }

  canLiquidate() {
    throw new Error('ILoanState.canLiquidate() debe ser implementado');
  }

  next() {
    throw new Error('ILoanState.next() debe ser implementado');
  }
}

module.exports = ILoanState;
