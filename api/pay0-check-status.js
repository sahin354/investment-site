// api/pay0-check-status.js

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method Not Allowed" });
  }

  try {
    const { order_id, user_id } = req.body;

    if (!order_id || !user_id) {
      return res
        .status(400)
        .json({ ok: false, message: "Missing order_id or user_id" });
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const params = new URLSearchParams();
    params.append("user_token", process.env.PAY0_USER_TOKEN);
    params.append("order_id", order_id);

    const response = await fetch(
      "https://pay0.shop/api/check-order-status",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      }
    );

    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch (e) {
      console.error("Pay0 check-status non-JSON:", text);
      return res.status(502).json({
        ok: false,
        message: "Gateway returned non-JSON response",
        raw: text,
      });
    }

    if (!result.status || result.result?.txnStatus !== "SUCCESS") {
      return res.json({
        ok: false,
        message: result.message || "Pending or Failed",
      });
    }

    const amount = Number(result.result.amount);

    // increment wallet using your function (you already had this)
    await supabase.rpc("increment_wallet", {
      uid: user_id,
      amount,
    });

    // Store transaction log
    await supabase.from("transactions").insert({
      user_id,
      order_id,
      amount,
      utr: result.result.utr,
      status: "SUCCESS",
    });

    return res.json({
      ok: true,
      utr: result.result.utr,
      amount,
    });
  } catch (error) {
    console.error("pay0-check-status error:", error);
    return res
      .status(500)
      .json({ ok: false, message: "Server error checking status" });
  }
}
