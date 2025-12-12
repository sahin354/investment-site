export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: true, message: "Method Not Allowed" }), {
      status: 405,
    });
  }

  try {
    const body = await req.json();
    const { amount, order_id, mobile } = body;

    if (!amount || !order_id) {
      return new Response(JSON.stringify({ error: true, message: "Missing fields" }), { status: 400 });
    }

    // Call Pay0
    const res = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAY0_USER_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        mobile: mobile || "9999999999",
        order_id,
        redirect_url: process.env.PAY0_REDIRECT_URL
      }),
    });

    const raw = await res.text();

    // Show raw Pay0 response for debugging
    return new Response(JSON.stringify({
      ok: res.ok,
      status: res.status,
      raw_response_from_pay0: raw
    }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: true, message: err.message }), {
      status: 500,
    });
  }
}
