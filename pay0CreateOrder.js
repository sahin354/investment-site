import fetch from "node-fetch"; import { 
createClient } from "@supabase/supabase-js"; 
export default async function handler(req, 
res) {
  if (req.method !== "POST") return 
  res.status(405).json({ error: "Method Not 
  Allowed" }); const { amount, mobile, 
  order_id, user_id, email } = req.body; if 
  (!amount || !mobile || !order_id) {
    return res.status(400).json({ error: 
    "Missing fields" });
  }
  const supabase = createClient( 
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  // Call Pay0 API
  const response = await 
  fetch("https://api.pay0.shop/create-order", 
  {
    method: "POST", headers: { "Content-Type": 
    "application/json" }, body: 
    JSON.stringify({
      api_key: process.env.PAYO_TOKEN, secret: 
      process.env.PAYO_SECRET, amount, mobile, 
      order_id
    })
  });
  const result = await response.json();
  // Store pending request
  await 
  supabase.from("payment_requests").insert({
    user_id, user_email: email, order_id, 
    amount, status: "pending", 
    customer_mobile: mobile
  });
  return res.status(200).json(result);
}
