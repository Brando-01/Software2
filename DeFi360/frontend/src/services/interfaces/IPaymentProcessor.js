export class IPaymentProcessor {
    async processPayment(paymentData){
        throw new Error("process payment no implementado");
    }

    async simulateLTV(paymentData){
        throw new Error("simular ltv no implementado");
    }
}