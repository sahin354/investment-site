export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    // 🔥 IMPORTANT: Parse body safely
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const { amount, customer_name, customer_mobile, order_id } = body;

    if (!amount || !customer_name || !customer_mobile || !order_id) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const PAY0_URL = process.env.PAY0_CREATE_URL;
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN || !REDIRECT_URL) {
      console.error("❌ Missing Pay0 ENV");
      return res.status(500).json({
        ok: false,
        message: "Payment gateway not configured",
      });
    }

    const params = new URLSearchParams();
    params.append("user_token", PAY0_TOKEN);
    params.append("amount", amount);
    params.append("order_id", order_id);
    params.append("customer_mobile", customer_mobile);
    params.append("customer_name", customer_name);
    params.append("redirect_url", REDIRECT_URL);

    const response = await fetch(PAY0_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const raw = await response.text();
    console.log("PAY0 RAW:", raw);

    const json = JSON.parse(raw);

    if (!json.status || !json.result?.payment_url) {
      return res.status(502).json({
        ok: false,
        message: json.message || "Pay0 rejected request",
      });
    }

    return res.status(200).json({
      ok: true,
      paymentUrl: json.result.payment_url,
    });

  } catch (err) {
    console.error("❌ pay0-create-order error:", err);
    return res.status(500).json({
      ok: false,
      message: "Payment gateway temporarily unavailable",
    });
  }
}
