// script-recharge.js - FIXED VERSION
import { supabase } from "./supabase.js";
import { appAuth } from "./common.js";

const MIN_RECHARGE = 120;
const SESSION_KEY = "active_recharge_order";

document.addEventListener("DOMContentLoaded", () => {
  const amountInput = document.getElementById("rechargeAmount");
  const quickButtons = document.querySelectorAll(".quick-amount-btn, .quick-amount");
  const rechargeBtn = document.getElementById("proceedRecharge");

  if (!amountInput || !rechargeBtn) return;

  // Quick amount buttons
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amt = btn.dataset.amount || btn.innerText.replace("₹", "").trim();
      amountInput.value = amt;
    });
  });

  // Main recharge button
  rechargeBtn.addEventListener("click", async (e) => {
    e.preventDefault();

    let amount = Number(amountInput.value);
    if (!amount || amount < MIN_RECHARGE || amount > 50000) {
      alert(`Amount must be between ₹${MIN_RECHARGE} and ₹50,000`);
      return;
    }

    // Get user
    let user;
    try {
      const { data: authData } = await supabase.auth.getUser();
      user = authData?.user || appAuth.user;
    } catch (err) {
      console.error("Auth error:", err);
    }

    if (!user) {
      alert("Please login first");
      window.location.href = "/login.html";
      return;
    }

    // 🔒 Session lock
    if (sessionStorage.getItem(SESSION_KEY)) {
      alert("Payment already in progress. Please complete or wait.");
      return;
    }

    // Get or ask for mobile
    let mobile = localStorage.getItem("userMobile");
    if (!mobile || mobile.length < 10) {
      mobile = prompt("Enter your mobile number (10 digits):");
      if (!mobile || mobile.length < 10) {
        alert("Valid mobile number required");
        return;
      }
      localStorage.setItem("userMobile", mobile);
    }

    // Generate order ID
    const orderId = "ORD_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);

    // Disable button
    rechargeBtn.disabled = true;
    rechargeBtn.textContent = "Processing...";

    try {
      // 1️⃣ Create payment request
      const { error: prError } = await supabase
        .from("payment_requests")
        .insert({
          user_id: user.id,
          user_email: user.email,
          order_id: orderId,
          amount: amount,
          status: "PENDING",
          payment_method: "Pay0",
          customer_mobile: mobile,
          created_at: new Date().toISOString()
        });

      if (prError) {
        console.error("Payment request error:", prError);
        throw new Error("Failed to create payment request. Please try again.");
      }

      // 2️⃣ Create transaction record
      const { error: txError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          user_email: user.email,
          type: "Deposit",
          amount: amount,
          status: "PENDING",
          reference_id: orderId,
          details: "Pay0 recharge initiated",
          created_at: new Date().toISOString()
        });

      if (txError) {
        console.error("Transaction error:", txError);
        // Continue anyway - main payment is already created
      }

      // 🔒 Set session lock
      sessionStorage.setItem(SESSION_KEY, orderId);

      // 3️⃣ Call your API endpoint
      const response = await fetch("/api/pay0-create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: amount,
          user_id: user.id,
          customer_mobile: mobile,
          customer_name: user.email || "Customer"
        })
      });

      const data = await response.json();

      if (!response.ok || !data.ok || !data.payment_url) {
        throw new Error(data.message || "Payment gateway error");
      }

      // 4️⃣ Redirect to payment
      window.location.href = data.payment_url;

    } catch (error) {
      console.error("Recharge error:", error);
      alert(error.message || "Something went wrong. Please try again.");
      
      // Clean up
      sessionStorage.removeItem(SESSION_KEY);
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });

  // Check for return from payment
  checkPaymentReturn();
});

// Check if returning from payment
async function checkPaymentReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");
  
  if (!orderId) return;
  
  // Clean URL
  window.history.replaceState({}, document.title, window.location.pathname);
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const response = await fetch("/api/pay0-check-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: orderId,
        user_id: user.id
      })
    });
    
    const result = await response.json();
    
    // Remove session lock
    sessionStorage.removeItem(SESSION_KEY);
    
    if (result.ok) {
      alert(`✅ Payment successful! ₹${result.amount} has been added to your wallet.`);
      
      // Refresh page to update balance display
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      alert("❌ Payment failed or is still processing. Please check your transactions.");
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    alert("Could not verify payment status. Please check your transactions.");
  }
    }
