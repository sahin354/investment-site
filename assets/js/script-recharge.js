import { supabase } from "./supabase.js";

/* =========================
   PAYMENT STATE (SAFE)
========================= */
function savePaymentState(data) {
  localStorage.setItem("active_payment", JSON.stringify(data));
}

function getPaymentState() {
  return JSON.parse(localStorage.getItem("active_payment"));
}

function clearPaymentState() {
  localStorage.removeItem("active_payment");
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Recharge script loaded");

  /* =========================
     QUICK AMOUNT BUTTONS
  ========================= */
  document.querySelectorAll(".quick-amount-btn, .quick-amount").forEach(btn => {
    btn.addEventListener("click", () => {
      const amount =
        btn.getAttribute("data-amount") ||
        btn.innerText.replace("₹", "").trim();

      const input = document.getElementById("rechargeAmount");
      if (input) input.value = amount;
    });
  });

  /* =========================
     CHECK RETURN / REFRESH
  ========================= */
  const params = new URLSearchParams(window.location.search);
  const returnedOrder = params.get("order_id");

  if (returnedOrder) {
    verifyPayment(returnedOrder);
  } else {
    const existing = getPaymentState();
    if (existing?.status === "PROCESSING") {
      verifyPayment(existing.order_id);
    }
  }

  /* =========================
     RECHARGE BUTTON
  ========================= */
  const rechargeBtn = document.getElementById("proceedRecharge");
  if (!rechargeBtn) return;

  rechargeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    const amountInput = document.getElementById("rechargeAmount");
    const amount = parseInt(amountInput.value);

    if (!amount || amount < 120 || amount > 50000) {
      alert("Amount must be between ₹120 and ₹50,000");
      return;
    }

    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Redirecting…";

    try {
      /* 1️⃣ Get logged-in user */
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData?.user) {
        alert("Please login first");
        window.location.href = "login.html";
        return;
      }

      const user = authData.user;

      /* 2️⃣ Generate order ID */
      const orderId =
        "ORD" + Date.now() + Math.floor(Math.random() * 10000);

      /* 3️⃣ Get mobile number */
      let mobile = localStorage.getItem("userMobile");
      if (!mobile || mobile.length < 10) {
        mobile = prompt("Enter your 10-digit mobile number");
        if (!mobile || mobile.length < 10) {
          alert("Valid mobile number required");
          rechargeBtn.disabled = false;
          rechargeBtn.textContent = "Proceed to Recharge";
          return;
        }
        localStorage.setItem("userMobile", mobile);
      }

      /* 🔐 Save payment state (refresh safe) */
      savePaymentState({
        order_id: orderId,
        amount,
        status: "PROCESSING",
        started_at: Date.now()
      });

      /* 4️⃣ Insert payment request */
      const { error: payErr } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          order_id: orderId,
          amount,
          status: "PROCESSING",
          payment_method: "Pay0",
          created_at: new Date().toISOString()
        });

      if (payErr) {
        throw new Error(payErr.message);
      }

      /* 5️⃣ Insert transaction */
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "Deposit",
        amount,
        status: "PROCESSING",
        reference_id: orderId,
        details: "Pay0 recharge initiated",
        created_at: new Date().toISOString()
      });

      /* 6️⃣ Create Pay0 order */
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

      if (!response.ok || !result.ok || !result.paymentUrl) {
        throw new Error("Gateway error");
      }

      /* ✅ Redirect to gateway */
      window.location.href = result.paymentUrl;

    } catch (err) {
      console.error("Recharge error:", err);
      alert("Payment gateway temporarily unavailable. Please try again.");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      clearPaymentState();
    }
  });
});

/* =========================
   VERIFY PAYMENT
========================= */
async function verifyPayment(orderId) {
  try {
    // Clean URL
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );

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
      alert("✅ Payment successful!");
      clearPaymentState();
      window.location.href = "index.html";
    } else if (result.status === "FAILED") {
      alert("❌ Payment failed");
      clearPaymentState();
      window.location.href = "index.html";
    } else {
      // still processing → keep state
      console.log("⏳ Payment still processing");
    }
  } catch (err) {
    console.warn("Verification error:", err);
  }
           }
