import axios from "axios";

export default async function handler(req, res) {
    try {
        const amount = req.method === "POST" ? req.body.amount : req.query.amount;
        const customer_mobile =
            req.method === "POST" ? req.body.customer_mobile : req.query.customer_mobile || "9999999999";

        if (!amount) {
            return res.status(400).json({ status: false, message: "Amount required" });
        }

        // Generate unique order ID
        const orderId = "ORD" + Date.now();

        // Create form data manually
        const formData = new URLSearchParams();
        formData.append("customer_mobile", customer_mobile);
        formData.append("customer_name", "User");
        formData.append("user_token", process.env.PAY0_TOKEN); // Use env variable
        formData.append("amount", amount);
        formData.append("order_id", orderId);
        formData.append("redirect_url", "https://investsafe.vercel.app/recharge.html");
        formData.append("remark1", "Recharge");
        formData.append("remark2", "InvestSafe");

        const response = await axios.post("https://pay0.shop/api/create-order", formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        return res.status(200).json(response.data);

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error?.response?.data || error.message,
        });
    }
}
