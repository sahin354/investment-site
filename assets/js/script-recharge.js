import { supabase } from "./supabase.js";

/* =========================
   CONSTANTS
========================= */
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const PAYMENT_KEY = "active_payment";

/* =========================
   PAYMENT STATE (LOCAL)
========================= */
function savePaymentState(data) {
  localStorage.setItem(PAYMENT_KEY, JSON.stringify(data));
}

function getPaymentState() {
  try {
    return JSON.parse(localStorage.getItem(PAYMENT_KEY));
  } catch {
    return null;
  }
}

function clearPaymentState() {
  localStorage.removeItem(PAYMENT_KEY);
}

/* =========================
   PENDING MESSAGE CONTROL
========================= */
function wasPendingNotified(orderId) {
  return localStorage.getItem("pending_notified_" + orderId) === "1";
}

function markPendingNotified(orderId) {
  localStorage.setItem("pending_notified_" + orderId, "1");
}

/* =========================
   COUNTDOWN (RESUMABLE)
========================= */
function startCountdown(startedAt) {
  const expiryAt = startedAt + PAYMENT_EXPIRY_MS;

  const timer = setInterval(() => {
    const remaining = expiryAt - Date.now();

    if (remaining <= 0) {
      clearInterval(timer);
      alert("⏳ Payment session expired");
      clearPaymentState();
      window.location.href = "index.html";
    }
  }, 1000);
}

/* =========================
   VERIFY PAYMENT (BACKEND TRUTH)
========================= */
async function verifyPayment(orderId, startedAt) {
  try {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;

    // Show pending info ONCE
    if (!wasPendingNotified(orderId)) {
      alert(
        "⏳ Your transaction is pending.\n\n" +
        "Please wait 2–5 minutes for confirmation.\n\n" +
        "You can safely go back to the main page."
      );
      markPendingNotified(orderId);
      setTimeout(() => {
        window.location.href = "index.html";
      }, 3000);
      return;
    }

    const res = await fetch("/api/pay0-check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        user_id: data.user.id
      })
    });

    const result = await res.json();

    if (result.status === "SUCCESS") {
      alert("✅ Payment successful! Wallet updated.");
      clearPaymentState();
      window.location.href = "index.html";
      return;
    }

    if (result.status === "FAILED") {
      alert("❌ Payment failed. Amount not credited.");
      clearPaymentState();
      window.location.href = "index.html";
      return;
    }

    // Still pending → retry after 5 sec
    setTimeout(() => verifyPayment(orderId, startedAt), 5000);

  } catch (err) {
    console.warn("Verification error:", err);
    setTimeout(() => verifyPayment(orderId, startedAt), 5000);
  }
}

/* =========================
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Recharge page loaded");

  /* QUICK AMOUNT BUTTONS (IMPORTANT – FIXED) */
  document.querySelectorAll(".quick-amount-btn, .quick-amount").forEach(btn => {
    btn.addEventListener("click", () => {
      const amount =
        btn.dataset.amount ||
        btn.innerText.replace("₹", "").trim();

      const input = document.getElementById("rechargeAmount");
      if (input) input.value = amount;
    });
  });

  /* AUTO CHECK PENDING PAYMENT */
  const state = getPaymentState();
  if (state && state.status === "PROCESSING") {
    startCountdown(state.started_at);
    verifyPayment(state.order_id, state.started_at);
  }

  /* RECHARGE BUTTON */
  const rechargeBtn = document.getElementById("proceedRecharge");
  if (!rechargeBtn) return;

  rechargeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const amount = parseInt(
      document.getElementById("rechargeAmount")?.value
    );

    if (!amount || amount < 120 || amount > 50000) {
      alert("Amount must be between ₹120 and ₹50,000");
      return;
    }

    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Redirecting…";

    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
      }

      const user = authData.user;
      const orderId = "ORD" + Date.now() + Math.floor(Math.random() * 10000);
      const startedAt = Date.now();

      let mobile = localStorage.getItem("userMobile");
      if (!mobile || mobile.length !== 10) {
        mobile = prompt("Enter your 10-digit mobile number");
        if (!mobile || mobile.length !== 10) {
          alert("Valid mobile number required");
          rechargeBtn.disabled = false;
          rechargeBtn.textContent = "Proceed to Recharge";
          return;
        }
        localStorage.setItem("userMobile", mobile);
      }

      /* SAVE STATE */
      savePaymentState({
        order_id: orderId,
        amount,
        status: "PROCESSING",
        started_at: startedAt
      });

      startCountdown(startedAt);

      /* INSERT PAYMENT REQUEST */
      await supabase.from("payment_requests").insert({
        user_id: user.id,
        order_id: orderId,
        amount,
        status: "PROCESSING",
        payment_method: "Pay0"
      });

      /* INSERT TRANSACTION (VISIBLE IN MINE PAGE) */
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "Deposit",
        amount,
        status: "PROCESSING",
        reference_id: orderId,
        details: "Pay0 recharge initiated"
      });

      /* CREATE PAY0 ORDER */
      const response = await fetch("/api/pay0-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          amount,
          customer_mobile: mobile,
          customer_name: user.email
        })
      });

      const result = await response.json();

      if (!response.ok || !result.paymentUrl) {
        throw new Error("Payment gateway error");
      }

      window.location.href = result.paymentUrl;

    } catch (err) {
      console.error("Recharge error:", err);
      alert("Payment gateway temporarily unavailable. Please try again.");
      clearPaymentState();
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });
});
