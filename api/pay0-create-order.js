export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: true,
      message: "Method Not Allowed"
    });
  }

  try {
    const { amount, customer_mobile, order_id } = req.body;

    if (!amount || !customer_mobile || !order_id) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields"
      });
    }

    const response = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAY0_USER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: Number(amount),
        order_id: order_id,
        customer_mobile: customer_mobile,
        redirect_url: process.env.PAY0_REDIRECT_URL
      })
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: true,
        message: "Pay0 returned invalid response",
        raw: text
      });
    }

    if (!response.ok || data.error) {
      return res.status(500).json({
        error: true,
        message: data.message || "Pay0 create order failed",
        raw: data
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
