// api/pay0-check-status.js (FULL SAFE FILE)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { order_id, user_id } = req.body;
  if (!order_id || !user_id) {
    return res.status(400).json({ ok: false });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1️⃣ Fetch order
  const { data: order } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("order_id", order_id)
    .single();

  if (!order || order.status !== "PENDING") {
    return res.json({ ok: false, message: "Already processed" });
  }

  // 2️⃣ Verify with Pay0
  const params = new URLSearchParams();
  params.append("user_token", process.env.PAY0_USER_TOKEN);
  params.append("order_id", order_id);

  const pay0Res = await fetch("https://pay0.shop/api/check-order-status", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const pay0 = await pay0Res.json();

  if (!pay0.status || pay0.result?.txnStatus !== "SUCCESS") {
    await supabase
      .from("payment_requests")
      .update({ status: "FAILED" })
      .eq("order_id", order_id);

    await supabase
      .from("transactions")
      .update({ status: "FAILED" })
      .eq("reference_id", order_id);

    return res.json({ ok: false });
  }

  const amount = Number(pay0.result.amount);

  // 3️⃣ SUCCESS (ATOMIC)
  await supabase.rpc("increment_wallet", {
    uid: user_id,
    amount,
  });

  await supabase
    .from("payment_requests")
    .update({ status: "SUCCESS", utr: pay0.result.utr })
    .eq("order_id", order_id);

  await supabase
    .from("transactions")
    .update({
      status: "SUCCESS",
      details: "Pay0 recharge successful",
    })
    .eq("reference_id", order_id);

  return res.json({ ok: true, amount });
}
