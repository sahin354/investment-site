import { supabase } from "./supabase.js";

/* =========================
   CONSTANTS
========================= */
const PAYMENT_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const PAYMENT_KEY = "active_payment";

/* =========================
   PAYMENT STATE
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
   PAGE LOAD
========================= */
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Recharge page loaded");

  /* =========================
     QUICK AMOUNT BUTTONS
  ========================= */
  document
    .querySelectorAll(".quick-amount-btn, .quick-amount")
    .forEach(btn => {
      btn.addEventListener("click", () => {
        const amount =
          btn.dataset.amount ||
          btn.innerText.replace("₹", "").trim();

        const input = document.getElementById("rechargeAmount");
        if (input) input.value = amount;
      });
    });

  /* =========================
     SHOW PENDING MESSAGE ON RETURN
     (NO VERIFY HERE)
  ========================= */
  const state = getPaymentState();
  if (state && state.status === "PROCESSING") {
    startCountdown(state.started_at);

    const shownKey = "pending_notified_" + state.order_id;
    if (!localStorage.getItem(shownKey)) {
      alert(
        "⏳ Your payment is pending.\n\n" +
        "Please wait 2–5 minutes for confirmation.\n\n" +
        "You can safely go to the main page."
      );
      localStorage.setItem(shownKey, "1");
    }
  }

  /* =========================
     RECHARGE BUTTON
  ========================= */
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
      const orderId =
        "ORD" + Date.now() + Math.floor(Math.random() * 10000);
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

      /* SAVE PAYMENT STATE */
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
        throw new Error("Gateway error");
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
