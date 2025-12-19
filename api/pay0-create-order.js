export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const { order_id, amount, customer_name, customer_mobile } = body;

  const params = new URLSearchParams({
    user_token: process.env.PAY0_USER_TOKEN,
    amount,
    order_id,
    customer_name,
    customer_mobile,
    redirect_url: "https://investsafe.vercel.app/recharge.html"
  });

  const r = await fetch(process.env.PAY0_CREATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  const t = await r.text();
  const j = JSON.parse(t);

  if (!j.status) {
    return res.status(500).json({ ok: false });
  }

  res.json({
    ok: true,
    paymentUrl: j.result.payment_url
  });
}
