// api/pay0CheckOrderStatus.js
// Node serverless function (CommonJS)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const { order_id } = body;

    if (!order_id) {
      res.statusCode = 400;
      return res.json({ message: "Missing order_id" });
    }

    // Call Pay0 order-status API
    const response = await fetch(process.env.PAY0_STATUS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAY0_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id }),
    });

    const data = await response.json();

    const payment_status = data.payment_status || data.status || "unknown";

    // Shape the response for your frontend script-recharge.js
    return res.json({
      status: payment_status === "success" ? "success" : payment_status,
      payment_status,
      utr: data.utr || data.transaction_id || null,
      raw: data,
    });
  } catch (err) {
    console.error("Pay0 check status error:", err);
    res.statusCode = 500;
    return res.json({
      error: true,
      message: "Server error while checking Pay0 status",
    });
  }
};
