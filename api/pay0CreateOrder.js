// api/pay0CreateOrder.js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { amount, mobile, order_id } = req.body || {};

    // Validate input
    if (!amount || !mobile || !order_id) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    const { PAY0_CREATE_URL, PAY0_TOKEN, PAY0_REDIRECT_URL } = process.env;

    if (!PAY0_CREATE_URL || !PAY0_TOKEN) {
      return res.status(500).json({ error: true, message: "Server Misconfigured (Missing Pay0 Env Vars)" });
    }

    // 1. Prepare Data as Form-UrlEncoded (Required by Pay0 PDF)
    const formData = new URLSearchParams();
    formData.append("user_token", PAY0_TOKEN); [span_7](start_span)// PDF calls this 'user_token'[span_7](end_span)
    formData.append("amount", amount);
    formData.append("order_id", order_id);
    formData.append("customer_mobile", mobile);
    formData.append("redirect_url", PAY0_REDIRECT_URL);
    formData.append("remark1", "Recharge");
    
    // 2. Send Request
    const response = await fetch(PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        [span_8](start_span)"Content-Type": "application/x-www-form-urlencoded", // Crucial per PDF[span_8](end_span)
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // 3. Handle Pay0 Response
    if (data.status === true && data.result) {
        [span_9](start_span)// PDF says payment_url is inside 'result' or root 'payment_url'[span_9](end_span)
        const paymentUrl = data.payment_url || data.result.payment_url;
        return res.status(200).json({ 
            status: true, 
            payment_url: paymentUrl,
            order_id: data.result.orderId 
        });
    } else {
        return res.status(400).json({ 
            error: true, 
            message: data.message || "Gateway Error" 
        });
    }

  } catch (err) {
    console.error("Pay0 Create Error:", err);
    return res.status(500).json({ error: true, message: err.message });
  }
};
