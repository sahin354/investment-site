const axios = require("axios");

module.exports = async function handler(req, res) {
    try {
        // SUPPORT GET AND POST BOTH
        const amount =
            req.method === "POST" ? req.body.amount : req.query.amount;

        if (!amount) {
            return res.status(400).json({
                status: false,
                message: "Amount is required",
            });
        }

        const customer_mobile =
            req.method === "POST"
                ? req.body.customer_mobile
                : req.query.customer_mobile || "9999999999";

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
            data,
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        return res.status(200).json(response.data);

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.response?.data || error.message,
        });
    }
};
