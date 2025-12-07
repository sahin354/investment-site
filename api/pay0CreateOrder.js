// api/pay0CreateOrder.js
export default async function handler(req, res) {
  // Only allow POST from your frontend
  if (req.method !== "POST") { return 
    res.status(405).json({ message: "Method Not Allowed" 
    });
  }
  // Read env vars from Vercel
  const { PAY0_CREATE_URL, PAY0_TOKEN, PAY0_SECRET, 
    PAY0_REDIRECT_URL,
  } = process.env;
  // If any env is missing -> clear error message
  if (!PAY0_CREATE_URL || !PAY0_TOKEN || !PAY0_SECRET) { 
    return res.status(500).json({
      error: true, message: "Pay0 config missing in 
      environment variables",
    });
  }
  try { const { amount, mobile, order_id } = req.body || 
    {}; if (!amount || !mobile || !order_id) {
      return res.status(400).json({ error: true, message: 
        "Missing amount, mobile or order_id",
      });
    }
    // Call Pay0 create-order
    const response = await fetch(PAY0_CREATE_URL, { method: 
      "POST", headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ api_key: PAY0_TOKEN, secret: 
        PAY0_SECRET, amount, mobile, order_id, 
        redirect_url: PAY0_REDIRECT_URL,
      }),
    });
    const data = await response.json();
    // Try to find payment link in different possible 
    // places
    const upi_link = data.upi_link || data.payment_url || 
      (data.result && (data.result.upi_link || 
      data.result.payment_url)) || (data.data && 
      (data.data.upi_link || data.data.payment_url)) || 
      null;
    if (!response.ok) {
      // Pay0 itself returned error
      return res.status(500).json({ error: true, message: 
        data.message || "Pay0 create-order failed", raw: 
        data,
      });
    }
    // Keep "upi_link" so your old frontend code still 
    // works
    return res.status(200).json({ ...data, upi_link,
    });
  } catch (err) {
    console.error("Pay0 create-order error:", err); return 
    res.status(500).json({
      error: true, message: err.message || "Internal server 
      error",
    });
  }
}
