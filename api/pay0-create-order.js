// api/pay0-create-order.js

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const { amount, customer_name, customer_mobile, order_id } = req.body;

    if (!amount || !customer_mobile || !customer_name || !order_id) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields",
      });
    }

    const PAY0_URL = process.env.PAY0_CREATE_URL;
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN || !REDIRECT_URL) {
      console.error("❌ Missing Pay0 env vars");
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
        "Authorization": `Bearer ${PAY0_TOKEN}` // 🔥 IMPORTANT
      },
      body: params.toString(),
    });

    const rawText = await response.text();
    console.log("[Pay0 RAW RESPONSE]", rawText);

    let json;
    try {
      json = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Pay0 returned non-JSON:", rawText);
      return res.status(502).json({
        ok: false,
        message: "Payment gateway invalid response",
      });
    }

    if (!json.status || !json.result?.payment_url) {
      console.error("❌ Pay0 rejected:", json);
      return res.status(502).json({
        ok: false,
        message: json.message || "Payment gateway rejected request",
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
