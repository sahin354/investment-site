// api/pay0-create-order.js

export default async function handler(req, res) {
  // 1️⃣ Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method Not Allowed"
    });
  }

  try {
    const { amount, customer_name, customer_mobile, order_id } = req.body;

    // 2️⃣ Validate input
    if (!amount || !customer_name || !customer_mobile || !order_id) {
      return res.status(400).json({
        ok: false,
        message: "Missing required fields"
      });
    }

    // 3️⃣ Read ENV (MATCHES YOUR VERCEL EXACTLY)
    const PAY0_CREATE_URL = process.env.PAY0_CREATE_URL;
    const PAY0_USER_TOKEN = process.env.PAY0_USER_TOKEN;
    const PAY0_REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_CREATE_URL || !PAY0_USER_TOKEN || !PAY0_REDIRECT_URL) {
      console.error("❌ Missing Pay0 ENV", {
        PAY0_CREATE_URL: !!PAY0_CREATE_URL,
        PAY0_USER_TOKEN: !!PAY0_USER_TOKEN,
        PAY0_REDIRECT_URL: !!PAY0_REDIRECT_URL,
      });

      return res.status(500).json({
        ok: false,
        message: "Server configuration error"
      });
    }

    // 4️⃣ Prepare Pay0 request (FORM URL ENCODED)
    const params = new URLSearchParams();
    params.append("user_token", PAY0_USER_TOKEN);
    params.append("order_id", order_id);
    params.append("amount", amount);
    params.append("customer_name", customer_name);
    params.append("customer_mobile", customer_mobile);
    params.append("redirect_url", PAY0_REDIRECT_URL);

    // 5️⃣ Call Pay0
    const response = await fetch(PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (err) {
      console.error("❌ Pay0 non-JSON response:", rawText);
      return res.status(502).json({
        ok: false,
        message: "Invalid response from payment gateway"
      });
    }

    // 6️⃣ Validate Pay0 success
    if (
      !data.status ||
      !data.result ||
      !data.result.payment_url
    ) {
      console.error("❌ Pay0 rejected order:", data);
      return res.status(502).json({
        ok: false,
        message: data.message || "Payment gateway error"
      });
    }

    // 7️⃣ ⚠️ IMPORTANT PLACE (DO NOT REMOVE)
    // 👉 HERE you will insert "PENDING" transaction later
    // Example (DO LATER):
    // saveTransaction({
    //   order_id,
    //   amount,
    //   status: "PENDING",
    //   gateway: "PAY0"
    // });

    // 8️⃣ Return payment URL
    return res.status(200).json({
      ok: true,
      paymentUrl: data.result.payment_url
    });

  } catch (err) {
    console.error("🔥 pay0-create-order error:", err);
    return res.status(500).json({
      ok: false,
      message: "Internal Server Error"
    });
  }
}
