// script-recharge.js  (Pay0 version, keeps old layout)

document.addEventListener("DOMContentLoaded", () => {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const amountInput = document.getElementById("rechargeAmount");
  const rechargeForm = document.getElementById("rechargeForm");

  // 🔹 Support both old & new class names for quick buttons
  const quickButtons = document.querySelectorAll(
    ".quick-amount-btn, .amount-btn"
  );

  const MIN_AMOUNT = 120;
  const MAX_AMOUNT = 50000;

  // -------------------------
  // 1. Quick amount buttons
  // -------------------------
  quickButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const amt = btn.getAttribute("data-amount");
      if (amt && amountInput) {
        amountInput.value = amt;
      }
    });
  });

  // ---------------------------------------
  // 2. Handle Pay0 return (after payment)
  // ---------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("pay0Return") === "1") {
    handlePay0Return();
  }

  // -------------------------
  // 3. Submit recharge form
  // -------------------------
  if (rechargeForm) {
    rechargeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const user = auth.currentUser;
      if (!user) {
        alert("Please log in first.");
        return;
      }

      // ✅ Find mobile:
      // 1) localStorage.userMobile
      // 2) Firebase user phoneNumber
      // 3) ask user once (prompt)
      let mobile = localStorage.getItem("userMobile");

      if (!mobile && user.phoneNumber) {
        mobile = user.phoneNumber.replace("+", "");
        localStorage.setItem("userMobile", mobile);
      }

      if (!mobile) {
        const entered = prompt(
          "Enter your UPI registered mobile number (10 digits):"
        );
        if (!entered || entered.trim().length < 10) {
          alert("Valid mobile number required to start payment.");
          return;
        }
        mobile = entered.trim();
        localStorage.setItem("userMobile", mobile);
      }

      // ✅ Validate amount
      const amount = parseFloat(amountInput.value);
      if (isNaN(amount)) {
        alert("Please enter recharge amount.");
        return;
      }
      if (amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        alert(`Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}.`);
        return;
      }

      // Order ID & redirect URL
      const orderId = "RECHARGE-" + Date.now();
      const redirectUrl =
        window.location.origin + "/recharge.html?pay0Return=1";

      const payload = {
        customer_mobile: mobile,
        customer_name: user.email || "User",
        amount,
        order_id: orderId,
        redirect_url: redirectUrl,
        remark1: "wallet-recharge",
        remark2: user.uid,
      };

      // Button state
      const submitBtn =
        document.getElementById("proceedRecharge") ||
        rechargeForm.querySelector("button[type='submit']");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Redirecting…";
      }

      try {
        // 🔥 IMPORTANT: use camelCase path (matches file name)
        const res = await fetch("/api/pay0CreateOrder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("pay0CreateOrder response:", data);

        if (res.ok && data.status && data.result?.payment_url) {
          // Save last order & amount for verification
          localStorage.setItem("pay0_last_order_id", orderId);
          localStorage.setItem("pay0_last_amount", String(amount));

          // Redirect to Pay0 payment page
          window.location.href = data.result.payment_url;
        } else {
          alert(data.message || "Server error. Please try again.");
        }
      } catch (err) {
        console.error(err);
        alert("Server error. Please try again.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Proceed to Recharge";
        }
      }
    });
  }
});

// -------------------------------------------
// 4. Called when user returns from Pay0 page
// -------------------------------------------
async function handlePay0Return() {
  const auth = firebase.auth();
  const db = firebase.firestore();

  const user = auth.currentUser;
  if (!user) {
    alert("Please login again to verify payment.");
    return;
  }

  const orderId = localStorage.getItem("pay0_last_order_id");
  const amount = parseFloat(localStorage.getItem("pay0_last_amount") || "0");

  if (!orderId || !amount) {
    // nothing to verify
    return;
  }

  try {
    // 🔥 IMPORTANT: camelCase path (matches file name)
    const res = await fetch("/api/pay0CheckOrderStatus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_id: orderId }),
    });

    const data = await res.json();
    console.log("pay0CheckOrderStatus response:", data);

    if (!res.ok || !data.status) {
      alert(data.message || "Could not verify payment. If money is debited, contact support with UTR.");
      return;
    }

    const status = (data.result?.status || "").toLowerCase();

    if (status === "success" || status === "completed") {
      // ✅ Add to user's wallet balance in Firestore
      const userDocRef = db.collection("users").doc(user.uid);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(userDocRef);
        const currentBalance = snap.exists ? snap.data().balance || 0 : 0;
        tx.update(userDocRef, {
          balance: currentBalance + amount,
        });
      });

      alert("Recharge successful! Wallet updated.");
      // clean local keys
      localStorage.removeItem("pay0_last_order_id");
      localStorage.removeItem("pay0_last_amount");

      // Reload to show updated balance (your old layout will handle display)
      window.location.href = "recharge.html";
    } else if (status === "pending") {
      alert("Payment is still pending. Please check after some time.");
    } else {
      alert("Payment failed or cancelled.");
    }
  } catch (err) {
    console.error(err);
    alert("Error while verifying payment status. Try again later.");
  }
    }
