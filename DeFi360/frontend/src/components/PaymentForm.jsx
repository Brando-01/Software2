import { useState } from "react";
import { MockPaymentProcessor } from "../services/mock/PaymentMock";

function PaymentForm({ currDebt, colValue }) {
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [ltvPreview, setLtvPreview] = useState(null);
    const paymentProcessor = new MockPaymentProcessor();

    const validate = (value) => {
        if (value <= 0) return "Monto menor a 0";
        if (value > currDebt) return "Monto no puede superar deuda";
        return "";
    };

    const handleChange = async (e) => {
        const value = parseFloat(e.target.value);
        setAmount(value);

        const validationError = validate(value);
        setError(validationError);
        if (!validationError) {
            const ltv = await paymentProcessor.simulateLTV({
                amount: value,
                currDebt,
                colValue,
            });
            setLtvPreview(ltv);
        }else{
            setLtvPreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validate(amount);
        if (validationError) {
            setError(validationError);
            return;
        }

        const result = await paymentProcessor.processPayment({
            amount,
            currDebt,
            colValue,
        });
        console.log("Pago realizado:", result);
    };