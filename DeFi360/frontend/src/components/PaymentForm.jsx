import { useState } from "react";
import { PaymentMock } from "../services/mock/PaymentMock";

function PaymentForm({ currDebt, colValue, paymentProcessor }) {
    const [amount, setAmount] = useState("");
    const [error, setError] = useState("");
    const [ltvPreview, setLtvPreview] = useState(null);

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


    return (
        <form onSubmit={handleSubmit}>
            <h2>Pagar Cuota</h2>

            <input
                type="number"
                placeholder="Monto"
                onChange={handleChange}
            />

            {error && <p style={{ color: "red" }}>{error}</p>}

            {ltvPreview !== null && (
                <p>LTV despues de pago: {ltvPreview.toFixed(2)}%</p>
            )}

            <button type="submit">Pagar</button>
        </form>
    );
}

export default PaymentForm;