import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  const { order_id, user_id } = req.body;

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

  const params = new URLSearchParams();
  params.append("user_token", process.env.PAY0_USER_TOKEN);
  params.append("order_id", order_id);

  const response = await fetch("https://pay0.shop/api/check-order-status", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const result = await response.json();

  if (!result.status || result.result.txnStatus !== "SUCCESS") {
    return res.json({ ok: false, message: result.message || "Pending or Failed" });
  }

  // Update wallet
  await supabase.rpc("increment_wallet", { uid: user_id, amount: Number(result.result.amount) });

  // Store transaction log
  await supabase.from("transactions").insert({
    user_id,
    order_id,
    amount: result.result.amount,
    utr: result.result.utr,
    status: "SUCCESS",
  });

  return res.json({ ok: true, utr: result.result.utr, amount: result.result.amount });
}
