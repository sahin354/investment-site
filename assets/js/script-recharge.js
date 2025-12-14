// script-recharge.js

import { supabase } from "./supabase.js";
import { appAuth } from "./common.js";

const MIN_RECHARGE = 1;
const SESSION_KEY = "active_recharge_order";

document.addEventListener("DOMContentLoaded", () => {
  const amountInput = document.getElementById("rechargeAmount");
  // Selecting quick buttons to maintain original UI functionality
  const quickButtons = document.querySelectorAll(".quick-amount-btn, .quick-amount");
  const rechargeBtn = document.getElementById("proceedRecharge");

  if (!amountInput || !rechargeBtn) return;

  // ---------- QUICK SELECT ----------
  // Preserved from original to ensure buttons like "100", "500" still work
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amt = btn.dataset.amount || btn.innerText.replace("₹", "").trim();
      amountInput.value = amt;
    });
  });

  // ---------- MAIN BUTTON (New Safe Logic) ----------
  rechargeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let amount = Number(amountInput.value);
    if (!amount || amount < MIN_RECHARGE) {
      alert(`Minimum recharge amount is ₹${MIN_RECHARGE}`);
      return;
    }

    const user = appAuth.user || (await supabase.auth.getUser()).data?.user;
    if (!user) {
      alert("Please login first");
      return;
    }

    // 🔒 SESSION LOCK: Prevent double clicks/duplicate orders
    const existingOrder = sessionStorage.getItem(SESSION_KEY);
    if (existingOrder) {
      alert("Payment already in progress. Please complete it.");
      return;
    }

    let mobile = localStorage.getItem("userMobile");
    if (!mobile) {
      mobile = prompt("Enter mobile number");
      if (!mobile || mobile.length < 10) {
        alert("Invalid mobile number");
        return;
      }
      localStorage.setItem("userMobile", mobile);
    }

    const orderId = "ORD_" + Date.now() + Math.random().toString(36).slice(2, 6);

    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Redirecting...";

    // 1️⃣ Save pending request
    const { error: prErr } = await supabase.from("payment_requests").insert({
      user_id: user.id,
      user_email: user.email,
      order_id: orderId,
      amount,
      status: "PENDING",
      payment_method: "Pay0",
      customer_mobile: mobile,
    });

    if (prErr) {
      console.error("DB Error", prErr);
      alert("Database error");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      return;
    }

    // 2️⃣ Pending transaction
    await supabase.from("transactions").insert({
      user_id: user.id,
      user_email: user.email,
      type: "Deposit",
      amount,
      status: "PENDING",
      reference_id: orderId,
      details: "Pay0 recharge initiated",
    });

    // 🔒 Lock session
    sessionStorage.setItem(SESSION_KEY, orderId);

    try {
      // 3️⃣ Create Pay0 order
      const res = await fetch("/api/pay0-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          customer_name: user.email || "User",
          customer_mobile: mobile,
          order_id: orderId,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok || !data.paymentUrl) {
        throw new Error(data.message || "Payment gateway error");
      }

      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error(err);
      alert(err.message || "Error initiating payment");
      sessionStorage.removeItem(SESSION_KEY);
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });

  verifyAfterReturn();
});

// 🔁 AFTER REDIRECT
async function verifyAfterReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  if (!orderId) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    const res = await fetch("/api/pay0-check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, user_id: user.id }),
    });

    const result = await res.json();

    // Release lock & clean URL
    sessionStorage.removeItem(SESSION_KEY);
    window.history.replaceState({}, document.title, window.location.pathname);

    if (result.ok) {
      alert(`Payment successful! ₹${result.amount} added.`);
    } else {
      alert("Payment failed or pending.");
    }
  } catch (e) {
    console.error("Verification error:", e);
  }
}
