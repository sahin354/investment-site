// api/pay0CreateOrder.js
// CommonJS Vercel function – talks to Pay0 only

module.exports = async (req, res) => {
  // Allow only POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, mobile, order_id } = req.body || {};

    if (!amount || !mobile || !order_id) {
      res.statusCode = 400;
      return res.json({ error: true, message: "Missing amount/mobile/order_id" });
    }

    const {
      PAY0_CREATE_URL,
      PAY0_TOKEN,
      PAY0_SECRET,
      PAY0_REDIRECT_URL,
    } = process.env;

    if (!PAY0_CREATE_URL || !PAY0_TOKEN || !PAY0_SECRET) {
      res.statusCode = 500;
      return res.json({
        error: true,
        message: "Pay0 env vars not set (PAY0_CREATE_URL / PAY0_TOKEN / PAY0_SECRET)",
      });
    }

    // Call Pay0 create_order
    const response = await fetch(PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // some Pay0 setups use token+secret in body, some use Bearer – adjust if your docs say so
      },
      body: JSON.stringify({
        api_key: PAY0_TOKEN,
        secret: PAY0_SECRET,
        amount,
        mobile,
        order_id,
        redirect_url: PAY0_REDIRECT_URL,
      }),
    });

    const data = await response.json();

    // Try to extract payment URL
    const payment_url =
      data.payment_url ||
      data.upi_link ||
      (data.data && (data.data.payment_url || data.data.upi_link)) ||
      (data.result && (data.result.payment_url || data.result.upi_link)) ||
      null;

    // Forward everything back so frontend can handle it
    res.statusCode = response.ok ? 200 : 500;
    return res.json({
      ...data,
      payment_url,
    });
  } catch (err) {
    console.error("Pay0 create-order error:", err);
    res.statusCode = 500;
    return res.json({
      error: true,
      message: err.message || "Internal server error in create-order",
    });
  }
};
