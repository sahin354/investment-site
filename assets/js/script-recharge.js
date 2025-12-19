import { supabase } from "./supabase.js";

/* ===============================
   PAYMENT STATE (REFRESH SAFE)
================================ */
function savePayment(state) {
  localStorage.setItem("active_payment", JSON.stringify(state));
}

function getPayment() {
  return JSON.parse(localStorage.getItem("active_payment"));
}

function clearPayment() {
  localStorage.removeItem("active_payment");
}

/* ===============================
   PAGE LOAD
================================ */
document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const returnedOrder = params.get("order_id");

  if (returnedOrder) {
    await verifyPayment(returnedOrder);
    return;
  }

  const existing = getPayment();
  if (existing && existing.status === "PROCESSING") {
    await verifyPayment(existing.order_id);
  }
});

/* ===============================
   RECHARGE CLICK
================================ */
document.getElementById("proceedRecharge").addEventListener("click", async () => {
  const amount = parseInt(document.getElementById("rechargeAmount").value);
  if (!amount || amount < 120 || amount > 50000) {
    alert("Invalid amount");
    return;
  }

  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    alert("Please login first");
    location.href = "login.html";
    return;
  }

  const user = auth.user;
  const orderId = "ORD" + Date.now();

  savePayment({
    order_id: orderId,
    amount,
    status: "PROCESSING",
    started_at: Date.now()
  });

  // Insert DB records
  await supabase.from("payment_requests").insert({
    user_id: user.id,
    order_id: orderId,
    amount,
    status: "PROCESSING",
    payment_method: "PAY0"
  });

  await supabase.from("transactions").insert({
    user_id: user.id,
    type: "Recharge",
    amount,
    status: "PROCESSING",
    reference_id: orderId
  });

  // Create gateway order
  const res = await fetch("/api/pay0-create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      order_id: orderId,
      amount,
      customer_name: user.email,
      customer_mobile: "9999999999"
    })
  });

  const json = await res.json();
  if (!json.ok || !json.paymentUrl) {
    alert("Payment gateway unavailable");
    clearPayment();
    return;
  }

  window.location.href = json.paymentUrl;
});

/* ===============================
   VERIFY PAYMENT
================================ */
async function verifyPayment(orderId) {
  try {
    const res = await fetch("/api/pay0-check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId })
    });

    const result = await res.json();

    if (result.status === "SUCCESS") {
      alert("✅ Payment successful");
      clearPayment();
      location.href = "index.html";
    }

    if (result.status === "FAILED") {
      alert("❌ Payment failed");
      clearPayment();
      location.href = "index.html";
    }

    if (result.status === "PROCESSING") {
      alert("⏳ Payment processing, please wait");
    }
  } catch {
    alert("Unable to verify payment");
  }
                             }
