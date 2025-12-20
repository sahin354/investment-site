import { supabase } from "../supabaseClient.js";

export default async function handler(req, res) {
  const payload = req.body;

  const {
    order_id,
    status,
    amount,
    transaction_id
  } = payload;

  // 1. Fetch payment record
  const { data: payment } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("order_id", order_id)
    .single();

  if (!payment || payment.status !== "PROCESSING") {
    return res.status(200).send("Ignored");
  }

  // 2. Verify amount
  if (payment.amount !== amount) {
    return res.status(400).send("Amount mismatch");
  }

  if (status === "SUCCESS") {
    // 3. Update payment
    await supabase.from("payment_requests")
      .update({ status: "SUCCESS" })
      .eq("order_id", order_id);

    // 4. Update wallet
    await supabase.rpc("increment_wallet", {
      uid: payment.user_id,
      amt: amount
    });

    // 5. Update transaction
    await supabase.from("transactions")
      .update({ status: "SUCCESS" })
      .eq("reference_id", order_id);
  }

  if (status === "FAILED") {
    await supabase.from("payment_requests")
      .update({ status: "FAILED" })
      .eq("order_id", order_id);

    await supabase.from("transactions")
      .update({ status: "FAILED" })
      .eq("reference_id", order_id);
  }

  return res.status(200).send("OK");
      }
