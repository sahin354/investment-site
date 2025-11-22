const axios = require("axios");

module.exports = async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ status: false, message: "Method not allowed" });
    }

    try {
        const { order_id } = req.body;

        if (!order_id) {
            return res.status(400).json({ status: false, message: "order_id required" });
        }

        const data = new URLSearchParams();
        data.append("user_token", process.env.PAY0_TOKEN);
        data.append("order_id", order_id);

        const response = await axios.post(
            "https://pay0.shop/api/check-order-status",
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
