// api/pay0CheckOrderStatus.js
module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { order_id } = req.body || {};
    if (!order_id) {
      return res.status(400).json({ error: true, message: "Missing order_id" });
    }

    const { PAY0_STATUS_URL, PAY0_TOKEN } = process.env;

    // 1. Prepare Form Data
    const formData = new URLSearchParams();
    formData.append("user_token", PAY0_TOKEN); [span_12](start_span)// PDF requirement[span_12](end_span)
    formData.append("order_id", order_id);

    // 2. Send Request
    const response = await fetch(PAY0_STATUS_URL, {
      method: "POST",
      headers: {
        [span_13](start_span)"Content-Type": "application/x-www-form-urlencoded", // Required[span_13](end_span)
      },
      body: formData.toString(),
    });

    const data = await response.json();

    // 3. Normalize Response
    [span_14](start_span)// PDF says 'status': true means API success, then check 'result.txnStatus'[span_14](end_span)
    let paymentSuccess = false;
    let utr = null;

    if (data.status === true && data.result) {
        if (data.result.txnStatus === "SUCCESS") {
            paymentSuccess = true;
            utr = data.result.utr;
        }
    }

    return res.status(200).json({
      status: paymentSuccess ? "success" : "pending",
      payment_status: paymentSuccess ? "success" : "pending",
      utr: utr,
      raw: data
    });

  } catch (err) {
    console.error("Pay0 Status Error:", err);
    return res.status(500).json({ error: true, message: err.message });
  }
};
