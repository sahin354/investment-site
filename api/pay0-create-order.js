export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method Not Allowed" });
  }

  try {
    const { amount, mobile, order_id } = await req.json?.() || req.body;

    if (!amount || !order_id) {
      return res.status(400).json({ error: true, message: "Missing Fields" });
    }

    const PAYO_URL = process.env.PAYO_CREATE_URL;
    const PAYO_TOKEN = process.env.PAYO_USER_TOKEN;
    const REDIRECT_URL = process.env.PAYO_REDIRECT_URL;

    if (!PAYO_URL || !PAYO_TOKEN || !REDIRECT_URL) {
      return res.status(500).json({
        error: true,
        message: "Missing ENV",
        env: {
          PAYO_URL: !!PAYO_URL,
          PAYO_TOKEN: !!PAYO_TOKEN,
          REDIRECT_URL: !!REDIRECT_URL
        }
      });
    }

    // ---- SEND REQUEST TO PAY0 ----
    const response = await fetch(PAYO_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PAYO_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount,
        order_id,
        mobile: mobile || "9999999999",
        redirect_url: REDIRECT_URL
      })
    });

    const raw = await response.text();

    // Debug response always
    return res.status(200).json({
      ok: false,
      status: response.status,
      raw_response: raw
    });

  } catch (err) {
    return res.status(500).json({
      error: true,
      message: err.message || "Unhandled error",
      stack: err.stack || null
    });
  }
}
