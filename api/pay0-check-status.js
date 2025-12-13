export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true });
  }

  const { order_id, user_id } = req.body;

  // 1️⃣ Fetch order
  const { data: order } = await supabase
    .from("payment_orders")
    .select("*")
    .eq("order_id", order_id)
    .single();

  if (!order || order.user_id !== user_id) {
    return res.json({ status: "FAILED" });
  }

  // 2️⃣ Already processed
  if (order.locked) {
    return res.json({ status: order.status });
  }

  // 3️⃣ Call Pay0 status API
  const pay0Res = await fetch(process.env.PAY0_STATUS_URL, {
    method: "POST",
    headers: {
      "Authorization": process.env.PAY0_USER_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ order_id })
  });

  const pay0Data = await pay0Res.json();

  if (pay0Data.status === "SUCCESS") {

    // 4️⃣ Update wallet
    await supabase.rpc("add_wallet_balance", {
      uid: user_id,
      amt: order.amount
    });

    // 5️⃣ Save transaction
    await supabase.from("transactions").insert({
      user_id,
      order_id,
      amount: order.amount,
      status: "SUCCESS",
      type: "RECHARGE"
    });

    // 6️⃣ Lock order
    await supabase.from("payment_orders")
      .update({ status: "SUCCESS", locked: true })
      .eq("order_id", order_id);

    return res.json({ status: "SUCCESS" });
  }

  // FAILED
  await supabase.from("payment_orders")
    .update({ status: "FAILED", locked: true })
    .eq("order_id", order_id);

  await supabase.from("transactions").insert({
    user_id,
    order_id,
    amount: order.amount,
    status: "FAILED",
    type: "RECHARGE"
  });

  return res.json({ status: "FAILED" });
}
