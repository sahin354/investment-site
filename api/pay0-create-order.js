// api/pay0-create-order.js
import axios from 'axios';

export default async function handler(req, res) {
  // 1. Allow only POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const { amount, customer_name, customer_mobile, order_id } = req.body;

    // 2. Validate Input
    if (!amount || !customer_mobile || !customer_name || !order_id) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // 3. Load Environment Variables
    const PAY0_URL = process.env.PAY0_CREATE_URL;
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN) {
      console.error("Missing Env Vars: PAY0_CREATE_URL or PAY0_USER_TOKEN");
      return res.status(500).json({ ok: false, message: "Server Misconfiguration" });
    }

    // 4. Prepare Data for Pay0
    // Pay0 requires application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append("customer_mobile", customer_mobile);
    params.append("customer_name", customer_name);
    params.append("user_token", PAY0_TOKEN);
    params.append("amount", amount);
    params.append("order_id", order_id);
    params.append("redirect_url", REDIRECT_URL);

    // 5. Send Request using Axios
    const response = await axios.post(PAY0_URL, params.toString(), {
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded" 
      }
    });

    // 6. Handle Pay0 Response
    // Axios automatically parses JSON, so we use response.data
    const result = response.data;

    if (!result.status || !result.result || !result.result.payment_url) {
      console.error("Pay0 Error:", result);
      return res.status(502).json({
        ok: false,
        message: result.message || "Payment Gateway Error",
      });
    }

    // 7. Success
    return res.status(200).json({
      ok: true,
      paymentUrl: result.result.payment_url,
    });

  } catch (error) {
    console.error("pay0-create-order error:", error.response?.data || error.message);
    return res.status(500).json({ 
      ok: false, 
      message: "Server error creating payment. Check logs." 
    });
  }
}
