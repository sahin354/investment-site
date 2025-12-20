import { supabase } from "./supabase.js";

/* =========================
   CONSTANTS & STATE
========================= */
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
let countdownTimer = null;
let verifyTimer = null;

/* =========================
   LOCAL STORAGE
========================= */
function savePaymentState(data) {
  localStorage.setItem("active_payment", JSON.stringify(data));
}

function getPaymentState() {
  try {
    return JSON.parse(localStorage.getItem("active_payment"));
  } catch {
    return null;
  }
}

function clearPaymentState() {
  localStorage.removeItem("active_payment");
}

/* =========================
   COUNTDOWN (SAFE)
========================= */
function startCountdown(startedAt) {
  if (countdownTimer) clearInterval(countdownTimer);

  const expiryAt = startedAt + PAYMENT_EXPIRY_MS;

  countdownTimer = setInterval(() => {
    if (Date.now() >= expiryAt) {
      clearInterval(countdownTimer);
      clearPaymentState();
      alert("⏳ Payment session expired");
      window.location.href = "index.html";
    }
  }, 1000);
}

/* =========================
   VERIFY PAYMENT (BACKEND TRUTH)
========================= */
async function verifyPayment(orderId) {
  if (verifyTimer) return;

  const poll = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) return;

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

      verifyTimer = setTimeout(poll, 5000);

    } catch {
      verifyTimer = setTimeout(poll, 5000);
    }
  };

  poll();
}

/* =========================
   MAIN
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Recharge script loaded");

  /* QUICK AMOUNT BUTTONS (DO NOT REMOVE) */
  const amountInput = document.getElementById("rechargeAmount");
  document.querySelectorAll(".quick-amount, .quick-amount-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const val =
        btn.dataset.amount ||
        btn.textContent.replace(/[^\d]/g, "");
      if (amountInput) amountInput.value = val;
    });
  });

  /* AUTO CHECK PENDING */
  const state = getPaymentState();
  if (state && state.status === "PROCESSING") {
    startCountdown(state.started_at);
    verifyPayment(state.order_id);
  }

  /* RECHARGE BUTTON */
  const rechargeBtn = document.getElementById("proceedRecharge");
  if (!rechargeBtn || !amountInput) return;

  rechargeBtn.addEventListener("click", async () => {
    const amount = parseInt(amountInput.value, 10);
    if (!amount || amount < 120 || amount > 50000) {
      alert("Amount must be between ₹120 and ₹50,000");
      return;
    }

    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Redirecting…";

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
      }

      const user = auth.user;
      const orderId = "ORD" + Date.now();
      const startedAt = Date.now();

      let mobile = localStorage.getItem("userMobile");
      if (!mobile || mobile.length !== 10) {
        mobile = prompt("Enter your 10-digit mobile number");
        if (!mobile || mobile.length !== 10) {
          throw new Error("Invalid mobile");
        }
        localStorage.setItem("userMobile", mobile);
      }

      savePaymentState({
        order_id: orderId,
        amount,
        status: "PROCESSING",
        started_at: startedAt
      });

      startCountdown(startedAt);

      await supabase.from("payment_requests").insert({
        user_id: user.id,
        order_id: orderId,
        amount,
        status: "PROCESSING",
        payment_method: "Pay0"
      });

      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "Deposit",
        amount,
        status: "PROCESSING",
        reference_id: orderId,
        details: "Pay0 recharge initiated"
      });

      const res = await fetch("/api/pay0-create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          amount,
          customer_mobile: mobile,
          customer_name: user.email
        })
      });

      const data = await res.json();

      /* ✅ ONLY CHECK THIS */
      if (!data.paymentUrl) {
        throw new Error("Payment URL missing");
      }

      window.location.href = data.paymentUrl;

    } catch (err) {
      console.error(err);
      alert("Payment gateway temporarily unavailable. Please try again.");
      clearPaymentState();
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });
});
