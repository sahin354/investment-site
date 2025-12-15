export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const { amount, user_id, order_id, customer_mobile, customer_name } = req.body;

    if (!amount || !user_id || !order_id) {
      return res.status(400).json({ error: true, message: "Missing required fields" });
    }

    // Verify user exists
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 1️⃣ Update payment request status to PROCESSING
    const { error: updateError } = await supabase
      .from("payment_requests")
      .update({
        status: "PROCESSING",
        updated_at: new Date().toISOString()
      })
      .eq("order_id", order_id)
      .eq("user_id", user_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({ error: true, message: "Failed to update payment request" });
    }

    // 2️⃣ Create Pay0 payment
    const pay0Res = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": process.env.PAY0_USER_TOKEN
      },
      body: JSON.stringify({
        order_id,
        amount,
        customer_name,
        customer_mobile,
        redirect_url: `${process.env.PAY0_REDIRECT_URL}?order_id=${order_id}&user_id=${user_id}`
      })
    });

    const pay0Data = await pay0Res.json();

    if (!pay0Data?.payment_url) {
      // Update status to FAILED
      await supabase
        .from("payment_requests")
        .update({ 
          status: "FAILED",
          updated_at: new Date().toISOString()
        })
        .eq("order_id", order_id);
      
      return res.status(500).json({ 
        error: true, 
        message: pay0Data.message || "Pay0 payment creation failed" 
      });
    }

    return res.json({
      ok: true,
      payment_url: pay0Data.payment_url
    });

  } catch (err) {
    console.error("Create order error:", err);
    return res.status(500).json({ error: true, message: "Internal server error" });
  }
        }
