// api/pay0-create-order.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase (Ensure these ENV variables are set in Vercel)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // 1. Allow only POST
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    // Added 'user_id' to destructuring so the new code can use it
    const { amount, customer_name, customer_mobile, order_id, user_id } = req.body;

    if (!amount || !customer_mobile || !customer_name || !order_id || !user_id) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    // 2. Get Env Vars
    const PAY0_URL = process.env.PAY0_CREATE_URL; // https://payo.shop/api/create-order
    const PAY0_TOKEN = process.env.PAY0_USER_TOKEN;
    const REDIRECT_URL = process.env.PAY0_REDIRECT_URL;

    if (!PAY0_URL || !PAY0_TOKEN) {
      console.error("Missing Vercel Env Vars");
      return res.status(500).json({ ok: false, message: "Server Config Error" });
    }

    // --- NEW CODE INSERTED HERE ---
    // Placed here so we record the database entry before attempting the external payment request.
    
    // 1. Save order as PENDING
    await supabase.from("payment_orders").insert({
      order_id,
      user_id,
      amount,
      status: "PENDING"
    });

    // 2. Create transaction (PENDING)
    await supabase.from("transactions").insert({
      user_id,
      order_id,
      amount,
      type: "RECHARGE",
      status: "PENDING"
    });
    // ------------------------------

    // 3. Prepare Form Data
    const params = new URLSearchParams();
    params.append("customer_mobile", customer_mobile);
    params.append("customer_name", customer_name);
    params.append("user_token", PAY0_TOKEN);
    params.append("amount", amount);
    params.append("order_id", order_id);
    params.append("redirect_url", REDIRECT_URL);

    // 4. Send Request (using standard fetch)
    const response = await fetch(PAY0_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    // 5. Handle Text Response (Safe Parsing)
    const text = await response.text();
    let json;

    try {
      json = JSON.parse(text);
    } catch (e) {
      console.error("Pay0 returned non-JSON:", text);
      return res.status(502).json({ 
        ok: false, 
        message: "Gateway Invalid Response", 
        raw: text.substring(0, 100) 
      });
    }

    // 6. Check Success
    if (!json.status || !json.result || !json.result.payment_url) {
      console.error("Pay0 Failed:", json);
      return res.status(502).json({ 
        ok: false, 
        message: json.message || "Gateway Rejected Transaction" 
      });
    }

    return res.status(200).json({
      ok: true,
      paymentUrl: json.result.payment_url,
    });

  } catch (error) {
    console.error("Critical Error:", error);
    return res.status(500).json({ 
      ok: false, 
      message: "Internal Server Error" 
    });
  }
      }
      
