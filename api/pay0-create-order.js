export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const { amount, order_id, customer_mobile } = req.body;

    if (!amount || !order_id || !customer_mobile) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields"
      });
    }

    // ENV safety check
    const missing = [];
    if (!process.env.PAY0_CREATE_URL) missing.push("PAY0_CREATE_URL");
    if (!process.env.PAY0_USER_TOKEN) missing.push("PAY0_USER_TOKEN");
    if (!process.env.PAY0_REDIRECT_URL) missing.push("PAY0_REDIRECT_URL");

    if (missing.length) {
      return res.status(500).json({
        error: true,
        message: "Missing ENV",
        missing
      });
    }

    const pay0Res = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAY0_USER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(amount),
        order_id: order_id,
        mobile: customer_mobile,
        redirect_url: process.env.PAY0_REDIRECT_URL
      })
    });

    const text = await pay0Res.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: true,
        message: "Invalid Pay0 response",
        raw: text
      });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.message
    });
  }
        }
