// script-recharge.js  –  ONLY VERCEL API, NO EDGE FUNCTION
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

      // 1) create payment_request
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

      // 3) call Vercel API to create Pay0 order
      const response = await fetch("/api/pay0CreateOrder", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    amount,
    order_id,
  }),
});

      const data = await res.json();
      console.log("[Pay0 create-order reply]", data);

      const paymentUrl =
        data.payment_url || data.result?.payment_url || data.data?.payment_url;

      if (!paymentUrl) {
        throw new Error(data.message || "Payment Gateway Error");
      }

      // 4) redirect to gateway
      window.location.href = paymentUrl;
    } catch (err) {
      console.error(err);
      alert("Payment Gateway Error");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
    }
  });

  // handle return from gateway
  checkPaymentAfterReturn();
});

// ---------- AFTER PAYMENT RETURN ----------
async function checkPaymentAfterReturn() {
  const params = new URLSearchParams(window.location.search);
  const orderId = params.get("order_id");

  // if user opened normal recharge page, nothing to do
  if (!orderId) return;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1) verify with backend
    const res = await fetch("/api/pay0CheckOrderStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });

    const verify = await res.json();
    console.log("[Pay0 check-order reply]", verify);

    if (!verify.status || verify.payment_status !== "success") {
      alert("Payment failed or cancelled.");
      cleanUrl();
      return;
    }

    // 2) get payment_request
    const { data: payment, error: payErr } = await supabase
      .from("payment_requests")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (payErr || !payment) {
      console.error("Payment request not found", payErr);
      cleanUrl();
      return;
    }

    if (payment.status !== "pending") {
      // already processed earlier
      cleanUrl();
      return;
    }

    // 3) update wallet
    const { data: profile } = await supabase
      .from("profiles")
      .select("balance, referred_by")
      .eq("id", user.id)
      .single();

    const currentBalance = profile?.balance || 0;
    const newBalance = currentBalance + payment.amount;

    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    // 4) mark payment + transaction success
    await supabase
      .from("payment_requests")
      .update({
        status: "completed",
        utr: verify.utr || verify.transaction_id || null,
      })
      .eq("id", payment.id);

    await supabase
      .from("transactions")
      .update({
        status: "Success",
        details: "Payment completed successfully",
      })
      .eq("reference_id", orderId);

    // 5) give referral commission (16 / 2 / 1 %) as locked
    await giveReferralCommission(user.id, payment.amount, profile?.referred_by);

    alert("Payment successful! Amount added to your wallet.");
  } catch (err) {
    console.error(err);
    alert("Error while confirming payment");
  } finally {
    cleanUrl();
  }
}

function cleanUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

// ---------- REFERRAL COMMISSION ----------
async function giveReferralCommission(userId, amount, directRefId) {
  try {
    let level1Id = directRefId;
    if (!level1Id) {
      const { data: p1 } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", userId)
        .single();
      level1Id = p1?.referred_by || null;
    }
    if (!level1Id) return;

    let level2Id = null;
    let level3Id = null;

    const { data: p2 } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", level1Id)
      .single();
    level2Id = p2?.referred_by || null;

    if (level2Id) {
      const { data: p3 } = await supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", level2Id)
        .single();
      level3Id = p3?.referred_by || null;
    }

    const rows = [];

    if (level1Id) {
      rows.push({
        user_id: level1Id,
        from_user_id: userId,
        level: 1,
        amount: Number((amount * 0.16).toFixed(2)),
        status: "locked",
      });
    }
    if (level2Id) {
      rows.push({
        user_id: level2Id,
        from_user_id: userId,
        level: 2,
        amount: Number((amount * 0.02).toFixed(2)),
        status: "locked",
      });
    }
    if (level3Id) {
      rows.push({
        user_id: level3Id,
        from_user_id: userId,
        level: 3,
        amount: Number((amount * 0.01).toFixed(2)),
        status: "locked",
      });
    }

    if (!rows.length) return;

    await supabase.from("referral_earnings").insert(rows);
  } catch (err) {
    console.error("giveReferralCommission error:", err);
  }
}
