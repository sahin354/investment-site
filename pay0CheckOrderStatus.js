import fetch from "node-fetch"; import { 
createClient } from "@supabase/supabase-js"; 
export default async function handler(req, 
res) {
  if (req.method !== "POST") return 
  res.status(405).json({ error: "Method Not 
  Allowed" }); const { order_id, user_id } = 
  req.body; if (!order_id) return 
  res.status(400).json({ error: "Order ID 
  missing" }); const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  // Check order status from Pay0
  const apiRes = await 
  fetch("https://api.pay0.shop/check-order", {
    method: "POST", headers: { "Content-Type": 
    "application/json" }, body: 
    JSON.stringify({
      api_key: process.env.PAYO_TOKEN, secret: 
      process.env.PAYO_SECRET, order_id
    })
  });
  const result = await apiRes.json(); if 
  (result.payment_status !== "success") {
    return res.status(200).json({ status: 
    "pending" });
  }
  // Update wallet
  const { data: profile } = await supabase 
    .from("profiles") .select("balance") 
    .eq("id", user_id) .single();
  const newBalance = (profile?.balance || 0) + 
  result.amount; await 
  supabase.from("profiles").update({ balance: 
  newBalance }).eq("id", user_id);
  // Update payment log
  await 
  supabase.from("payment_requests").update({
    status: "success", utr: result.utr || null
  }).eq("order_id", order_id);
  return res.status(200).json({ status: 
  "success" });
}
