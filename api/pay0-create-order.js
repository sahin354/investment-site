export const config = { runtime: "nodejs" };   // <-- add this

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const { amount, customer_name, customer_mobile, order_id } = req.body;

    if (!amount || !customer_mobile || !customer_name || !order_id) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const PAY0_URL = process.env.PAY0_CREATE_URL;
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN || !REDIRECT_URL) {
      return res.status(500).json({
        ok: false,
        message: "Missing Pay0 environment variables",
      });
    }

    const params = new URLSearchParams();
    params.append("customer_mobile", customer_mobile);
    params.append("customer_name", customer_name);
    params.append("user_token", PAY0_TOKEN);
    params.append("amount", amount);
    params.append("order_id", order_id);
    params.append("redirect_url", REDIRECT_URL);

    const response = await fetch(PAY0_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const raw = await response.text();
    let json;

    try {
      json = JSON.parse(raw);
    } catch (e) {
      return res.status(502).json({
        ok: false,
        message: "Gateway returned non-JSON response",
        raw,
      });
    }

    if (!json.status || !json.result?.payment_url) {
      return res.status(502).json({
        ok: false,
        message: json.message || "Gateway rejected",
        raw: json,
      });
    }

    return res.status(200).json({
      ok: true,
      paymentUrl: json.result.payment_url,
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Server error creating payment",
    });
  }
};
