export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, mobile, order_id } = req.body;

    if (!amount || !mobile || !order_id) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const params = new URLSearchParams();
    params.append("user_token", process.env.PAY0_TOKEN);
    params.append("amount", amount);
    params.append("mobile", mobile);
    params.append("order_id", order_id);
    params.append("redirect_url", process.env.PAY0_REDIRECT_URL);

    const response = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await response.json();
    console.log("PAY0 Response:", result);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Pay0 ERROR:", error);
    return res.status(500).json({ message: "Payment Gateway Error", error: error.message });
  }
}
