<<<<<<< HEAD
/**
 * IPaymentProcessor - Interfaz (contrato) para procesadores de pago.
 * En JS no hay interfaces reales, se simula con una clase base
 * que lanza errores si no se implementan los métodos.
 */
class IPaymentProcessor {
  /**
   * Procesa un pago de préstamo.
   * @param {object} params
   * @param {number} params.loanId       - ID del préstamo
   * @param {number} params.amount       - Monto a pagar
   * @param {number} params.borrowerId   - ID del deudor
   * @param {number} params.lenderId     - ID del prestamista
   * @returns {Promise<{success: boolean, transactionId: string, newBalance: number, newLTV: number}>}
   */
=======
class IPaymentProcessor {
>>>>>>> 08f070ad70ba6ed75feeb9cc53457694cc1c46ff
  async processPayment({ loanId, amount, borrowerId, lenderId }) {
    throw new Error('processPayment() debe ser implementado por la subclase');
  }

<<<<<<< HEAD
  /**
   * Recalcula el LTV después de un pago.
   * @param {number} remainingBalance  - Saldo restante del préstamo
   * @param {number} collateralAmount  - Cantidad de colateral
   * @param {number} collateralPrice   - Precio actual del colateral
   * @returns {number} LTV en porcentaje
   */
=======
  
>>>>>>> 08f070ad70ba6ed75feeb9cc53457694cc1c46ff
  recalculateLTV(remainingBalance, collateralAmount, collateralPrice = 3000) {
    throw new Error('recalculateLTV() debe ser implementado por la subclase');
  }
}

module.exports = IPaymentProcessor;