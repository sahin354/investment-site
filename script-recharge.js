// script-recharge.js  – FIXED & WORKING WITH VERCEL BACKEND

import { supabase } from "./supabase.js";
import { appAuth } from "./common.js";

console.log("[Recharge] script loaded");

const MIN_RECHARGE = 120;

document.addEventListener("DOMContentLoaded", () => {
  const amountInput = document.getElementById("rechargeAmount");
  const quickButtons = document.querySelectorAll(".quick-amount-btn, .quick-amount");
  const rechargeBtn = document.getElementById("proceedRecharge");

  if (!amountInput || !rechargeBtn) {
    console.error("Recharge elements not found");
    return;
  }

  // ---------- QUICK SELECT ----------
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amt = btn.dataset.amount || btn.innerText.replace("₹", "").trim();
      amountInput.value = amt;
    });
  });

  // ---------- MAIN BUTTON ----------
  rechargeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let amount = parseFloat(amountInput.value.trim());
    if (isNaN(amount) || amount < MIN_RECHARGE) {
      alert(`Minimum recharge amount is ₹${MIN_RECHARGE}`);
      return;
    }

    // mobile
    let mobile = localStorage.getItem("userMobile");
    if (!mobile) {
      mobile = prompt("Enter your mobile number:");
      if (!mobile || mobile.length < 10) {
        alert("Please enter valid mobile number");
        return;
      }
      localStorage.setItem("userMobile", mobile);
    }

    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Processing...";

    try {
      // current user
      let user = appAuth?.user || null;
      if (!user) {
        const { data } = await supabase.auth.getUser();
        user = data?.user || null;
      }
      if (!user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
      }

      const orderId = "ORD" + Date.now() + Math.random().toString(36).slice(2, 6);

      // 1) save in DB as pending
      const { error: prErr } = await supabase.from("payment_requests").insert({
        user_id: user.id,
        user_email: user.email,
        order_id: orderId,
        amount,
        status: "pending",
        payment_method: "Pay0",
        customer_mobile: mobile,
      });

      if (prErr) {
        console.error(prErr);
        throw new Error("Failed to create payment request");
      }

      // 2) log transaction as Pending
      await supabase.from("transactions").insert({
        user_id: user.id,
        user_email: user.email,
        type: "Deposit",
        amount,
        status: "Pending",
        details: "Recharge via Pay0",
        reference_id: orderId,
      });

      // 3) call Vercel backend to create Pay0 order
      const response = await fetch("/api/pay0-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          customer_name: user.email || "User",
          customer_mobile: mobile,
          order_id: orderId,
        }),
      });

      const data = await response.json();
      console.log("[Pay0 create-order reply]", data);

      if (!data.ok || !data.paymentUrl) {
        throw new Error(data.message || "Payment Gateway Error");
      }

      // 4) redirect user to gateway
      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error(err);
      alert(err.message || "Payment Gateway Error");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });

  checkPaymentAfterReturn();
});


// -------------------- AFTER PAYMENT RETURN --------------------
async function checkPaymentAfterReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  if (!orderId) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const res = await fetch("/api/pay0-check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId, user_id: user.id }),
    });

    const verify = await res.json();
    console.log("[Pay0 check-order reply]", verify);

    if (!verify.ok) {
      alert("Payment failed or still pending.");
      cleanUrl();
      return;
    }

    alert(`Payment Successful!\n₹${verify.amount} added to wallet.`);

  } catch (err) {
    console.error(err);
    alert("Error verifying payment.");
  } finally {
    cleanUrl();
  }
}

function cleanUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
  }
