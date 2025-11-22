const axios = require("axios");

module.exports = async function handler(req, res) {
    try {
        if (req.method !== "POST") {
            return res.status(405).json({
                status: false,
                message: "Method not allowed"
            });
        }

        const { amount, customer_mobile } = req.body;

        if (!amount || !customer_mobile) {
            return res.status(400).json({
                status: false,
                message: "Amount & customer_mobile required"
            });
        }

        const orderId = "ORD" + Date.now();

        const data = new URLSearchParams();
        data.append("customer_mobile", customer_mobile);
        data.append("customer_name", "User");
        data.append("user_token", process.env.PAY0_TOKEN);
        data.append("amount", amount);
        data.append("order_id", orderId);
        data.append("redirect_url", "https://investsafe.vercel.app/recharge.html");
        data.append("remark1", "Recharge");
        data.append("remark2", "InvestSafe");

        const response = await axios.post(
            "https://pay0.shop/api/create-order",
            data.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            }
        );

        return res.status(200).json(response.data);

    } catch (err) {
        return res.status(500).json({
            status: false,
            message: err.response?.data || err.message
        });
    }
};
