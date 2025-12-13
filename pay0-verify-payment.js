import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.BASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const { order_id, user_id } = req.body;

    if (!order_id || !user_id) {
      return res.status(400).json({ error: true, message: "Missing data" });
    }

    // 1️⃣ CHECK PAYMENT STATUS FROM PAY0
    const pay0Res = await fetch(process.env.PAY0_STATUS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAY0_USER_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ order_id })
    });

    const pay0Data = await pay0Res.json();

    /*
      Expected:
      pay0Data.status = SUCCESS | FAILED | PENDING
      pay0Data.amount
    */

    // 2️⃣ SAVE TRANSACTION (ALWAYS)
    await supabase.from("transactions").insert({
      user_id,
      order_id,
      amount: pay0Data.amount,
      status: pay0Data.status,
      gateway: "PAY0"
    });

    // 3️⃣ UPDATE WALLET ONLY IF SUCCESS
    if (pay0Data.status === "SUCCESS") {
      await supabase.rpc("add_wallet_balance", {
        uid: user_id,
        amt: pay0Data.amount
      });
    }

    return res.json({
      success: true,
      status: pay0Data.status
    });

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.message
    });
  }
}
