// api/pay0CheckOrderStatus.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method Not Allowed" });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ status: false, message: "Missing order_id" });
    }

    const params = new URLSearchParams();
    params.append("user_token", process.env.PAY0_TOKEN);
    params.append("order_id", order_id);

    const response = await fetch(process.env.PAY0_STATUS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const data = await response.json();

    // Normalise to what frontend expects
    return res.status(200).json({
      status: data.status === "success",
      payment_status: data.status,
      amount: data.amount,
      utr: data.utr || data.transaction_id,
      raw: data,
    });
  } catch (err) {
    console.error("pay0CheckOrderStatus error:", err);
    return res
      .status(500)
      .json({ status: false, message: "Gateway error", error: String(err) });
  }
}
