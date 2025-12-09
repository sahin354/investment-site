import fetch from "node-fetch";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method Not Allowed" });
    }

    const { amount, customer_name, customer_mobile, order_id } = req.body;

    if (!amount || !customer_mobile || !customer_name || !order_id) {
      return res.json({ ok: false, message: "Missing payment data" });
    }

    const user_token = process.env.PAY0_USER_TOKEN;

    const params = new URLSearchParams();
    params.append("customer_mobile", customer_mobile);
    params.append("customer_name", customer_name);
    params.append("user_token", user_token);
    params.append("amount", amount);
    params.append("order_id", order_id);
    params.append("redirect_url", "https://investsafe.vercel.app/payment-success.html");

    const response = await fetch("https://pay0.shop/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await response.json();

    if (!result.status) {
      return res.json({ ok: false, message: result.message });
    }

    return res.json({ ok: true, paymentUrl: result.result.payment_url });

  } catch (err) {
    return res.json({ ok: false, message: "Server Error" });
  }
}
