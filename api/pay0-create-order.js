import axios from "axios";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ status: false, message: "Method not allowed" });
    }

    try {
        const { amount, customer_mobile } = req.body;

        // Generate order ID
        const orderId = "ORD" + Date.now();

        // Pay0 API request
        const response = await axios.post(
            "https://pay0.shop/api/create-order",
            new URLSearchParams({
                customer_mobile: customer_mobile,
                customer_name: "User",
                user_token: "YOUR_API_KEY",
                amount: amount,
                order_id: orderId,
                redirect_url: "https://investsafe.vercel.app/recharge.html",
                remark1: "Recharge",
                remark2: "InvestSafe"
            }),
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" }
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}
