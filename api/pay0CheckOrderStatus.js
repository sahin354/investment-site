// api/pay0CheckOrderStatus.js
// CommonJS Vercel function – asks Pay0 for status

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ message: "Method Not Allowed" });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      res.statusCode = 400;
      return res.json({ error: true, message: "Missing order_id" });
    }

    const { PAY0_STATUS_URL, PAY0_TOKEN, PAY0_SECRET } = process.env;

    if (!PAY0_STATUS_URL || !PAY0_TOKEN || !PAY0_SECRET) {
      res.statusCode = 500;
      return res.json({
        error: true,
        message: "Pay0 env vars not set (PAY0_STATUS_URL / PAY0_TOKEN / PAY0_SECRET)",
      });
    }

    const response = await fetch(PAY0_STATUS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: PAY0_TOKEN,
        secret: PAY0_SECRET,
        order_id,
      }),
    });

    const data = await response.json();

    const payment_status = data.payment_status || data.status || "unknown";

    res.statusCode = response.ok ? 200 : 500;
    return res.json({
      status: payment_status === "success" ? "success" : payment_status,
      payment_status,
      utr: data.utr || data.transaction_id || null,
      raw: data,
    });
  } catch (err) {
    console.error("Pay0 check-status error:", err);
    res.statusCode = 500;
    return res.json({
      error: true,
      message: err.message || "Internal server error in check-status",
    });
  }
};
