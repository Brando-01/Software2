import { IPaymentProcessor } from "../interfaces/IPaymentProcessor";

export class PaymentMock extends IPaymentProcessor {
    async processPayment({ amount, currDebt, colValue }) {
        const newDebt = currDebt - amount;
        const newLTV = (newDebt / colValue) * 100;

        return {
            success: true,
            newDebt,
            newLTV,
        };
    }

    async simulateLTV({ amount, currDebt, colValue}) {
        const newDebt = currDebt - amount;
        return (newDebt / colValue) * 100;
    }
}