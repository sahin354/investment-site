export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const { amount, user_id } = req.body;

    if (!amount || !user_id) {
      return res.status(400).json({ error: true, message: "Invalid request" });
    }

    const order_id = "ORD" + Date.now();

    // 1️⃣ Save order as PENDING
    await supabase.from("payment_orders").insert({
      order_id,
      user_id,
      amount,
      status: "PENDING",
      locked: false
    });

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
        redirect_url: `${process.env.PAY0_REDIRECT_URL}?order_id=${order_id}`
      })
    });

    const pay0Data = await pay0Res.json();

    if (!pay0Data?.payment_url) {
      return res.status(500).json({ error: true, message: "Pay0 error" });
    }

    return res.json({
      ok: true,
      payment_url: pay0Data.payment_url
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: true, message: "Internal error" });
  }
}
