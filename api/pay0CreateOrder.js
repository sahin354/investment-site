// api/pay0CreateOrder.js
// Node serverless function (CommonJS)

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.json({ message: "Method Not Allowed" });
  }

  try {
    const body = req.body || {};
    const { amount, mobile, order_id } = body;

    if (!amount || !mobile || !order_id) {
      res.statusCode = 400;
      return res.json({ message: "Missing amount / mobile / order_id" });
    }

    // Call Pay0 create-order API
    const response = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAY0_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        mobile,
        order_id,
        redirect_url: process.env.PAY0_REDIRECT_URL,
      }),
    });

    const data = await response.json();

    // Just forward Pay0 response to frontend
    res.statusCode = response.status || 200;
    return res.json(data);
  } catch (err) {
    console.error("Pay0 create order error:", err);
    res.statusCode = 500;
    return res.json({
      error: true,
      message: "Server error while creating Pay0 order",
    });
  }
};
