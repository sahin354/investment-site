export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { amount, user_id } = req.body || {};

    if (!amount || !user_id) {
      return res.status(400).json({
        error: "Missing amount or user_id"
      });
    }

    const PAY0_URL = process.env.PAY0_CREATE_URL;
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN || !REDIRECT_URL) {
      return res.status(500).json({
        error: "ENV_MISSING",
        env: {
          PAY0_CREATE_URL: !!PAY0_URL,
          PAY0_USER_TOKEN: !!PAY0_TOKEN,
          PAY0_REDIRECT_URL: !!REDIRECT_URL
        }
      });
    }

    const orderPayload = {
      amount: Number(amount),
      currency: "INR",
      redirect_url: `${REDIRECT_URL}?uid=${user_id}`,
      order_id: "ORD_" + Date.now()
    };

    const pay0Res = await fetch(PAY0_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PAY0_TOKEN}`
      },
      body: JSON.stringify(orderPayload)
    });

    const pay0Data = await pay0Res.json();

    if (!pay0Res.ok) {
      return res.status(500).json({
        error: "PAY0_FAILED",
        pay0Data
      });
    }

    return res.status(200).json({
      success: true,
      payment_url: pay0Data.payment_url,
      order_id: orderPayload.order_id
    });

  } catch (err) {
    console.error("PAY0 CREATE ERROR:", err);
    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: err.message
    });
  }
}
