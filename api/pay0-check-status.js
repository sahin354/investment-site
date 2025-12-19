import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { order_id } = req.body;

  const gateway = await fetch(
    `https://pay0.shop/api/check-order?order_id=${order_id}`
  );
  const g = await gateway.json();

  if (!g.status) {
    await updateStatus("FAILED");
    return res.json({ status: "FAILED" });
  }

  if (g.result.status === "SUCCESS") {
    const { data } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (data.status === "SUCCESS") {
      return res.json({ status: "SUCCESS" });
    }

    // Update wallet
    await supabase.rpc("increment_balance", {
      uid: data.user_id,
      amt: data.amount
    });

    await updateStatus("SUCCESS");
    return res.json({ status: "SUCCESS" });
  }

  return res.json({ status: "PROCESSING" });

  async function updateStatus(status) {
    await supabase
      .from("payment_requests")
      .update({ status })
      .eq("order_id", order_id);

    await supabase
      .from("transactions")
      .update({ status })
      .eq("reference_id", order_id);
  }
}
