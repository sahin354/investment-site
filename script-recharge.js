// script-recharge.js

// GLOBALS
let currentUser = null;
let db = null;

// -----------------------------
// INIT FIREBASE + AUTH STATE
// -----------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (!firebase.apps.length) {
    console.error("Firebase not initialized. Check firebaseConfig.js.");
    return;
  }

  db = firebase.firestore();

  // Listen for login state
  firebase.auth().onAuthStateChanged(async (user) => {
    currentUser = user;
    if (!user) {
      // Not logged in, you can redirect to login if you want
      // window.location.href = "login.html";
      return;
    }

    // Load wallet balance and sidebar info
    await loadUserInfo(user);

    // If Pay0 redirected back with ?pay0Return=1 → verify payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("pay0Return") === "1") {
      handlePay0Return();
    }
  });

  setupRechargeUI();
});

// -----------------------------
// LOAD USER INFO (BALANCE + SIDEBAR)
// -----------------------------
async function loadUserInfo(user) {
  try {
    const userRef = db.collection("users").doc(user.uid);
    const snap = await userRef.get();

    if (!snap.exists) return;

    const data = snap.data();

    // Current balance
    const balanceEl = document.getElementById("currentBalance");
    if (balanceEl) {
      const bal = typeof data.balance === "number" ? data.balance : 0;
      balanceEl.textContent = "₹" + bal.toFixed(2);
    }

    // Sidebar info
    const sidebarIdEl = document.getElementById("sidebarId");
    if (sidebarIdEl && data.userId) {
      sidebarIdEl.textContent = "ID: " + data.userId;
    }

    const sidebarVIPEl = document.getElementById("sidebarVIP");
    if (sidebarVIPEl && data.vipLevel) {
      sidebarVIPEl.textContent = "VIP: " + data.vipLevel;
    }
  } catch (err) {
    console.error("Error loading user info:", err);
  }
}

// -----------------------------
// RECHARGE UI: QUICK BUTTONS + SUBMIT
// -----------------------------
function setupRechargeUI() {
  const amountInput = document.getElementById("rechargeAmount");
  const quickButtons = document.querySelectorAll(".quick-amount-btn");
  const rechargeForm = document.getElementById("rechargeForm");

  const MIN_AMOUNT = 120;
  const MAX_AMOUNT = 50000;

  // Quick amount buttons
  if (amountInput && quickButtons.length) {
    quickButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        // remove active class everywhere
        quickButtons.forEach((b) => b.classList.remove("active"));

        // add to current button
        btn.classList.add("active");

        const value = btn.getAttribute("data-amount");
        if (value) {
          amountInput.value = value;
        }
      });
    });
  }

  // Handle form submit → Pay0 create order
  if (rechargeForm && amountInput) {
    rechargeForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      if (!currentUser) {
        alert("Please login first.");
        return;
      }

      const amount = parseFloat(amountInput.value);
      if (isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
        alert(
          "Please enter a valid amount between ₹" +
            MIN_AMOUNT +
            " and ₹" +
            MAX_AMOUNT +
            "."
        );
        return;
      }

      const orderId = "RECHARGE-" + Date.now();
      // Redirect back to this same page after payment
      const redirectUrl =
        window.location.origin +
        window.location.pathname +
        "?pay0Return=1";

      const payload = {
        customer_mobile: currentUser.phoneNumber
          ? currentUser.phoneNumber.replace("+", "")
          : "9999999999",
        customer_name: currentUser.displayName || currentUser.email || "User",
        amount: amount,
        order_id: orderId,
        redirect_url: redirectUrl,
        remark1: "wallet-recharge",
        remark2: currentUser.uid,
      };

      const submitBtn = document.getElementById("proceedRecharge");
      let originalText;
      if (submitBtn) {
        submitBtn.disabled = true;
        originalText = submitBtn.textContent;
        submitBtn.textContent = "Redirecting to Payment...";
      }

      try {
        const res = await fetch("/api/pay0-create-order", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log("Pay0 create-order:", data);

        if (data.status && data.result && data.result.payment_url) {
          // Save info to verify after redirect
          localStorage.setItem("pay0_last_order_id", orderId);
          localStorage.setItem("pay0_last_amount", String(amount));

          // 👉 OPTION B: open Pay0 link in new tab
          window.open(data.result.payment_url, "_blank");
        } else {
          alert(data.message || "Unable to start payment. Please try again.");
        }
      } catch (err) {
        console.error("Error creating Pay0 order:", err);
        alert("Something went wrong while connecting to payment gateway.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText || "Proceed to Recharge";
        }
      }
    });
  }

  // Sidebar toggle (if you use it on this page)
  const menuBtn = document.getElementById("menuBtn");
  const sideMenu = document.getElementById("sideMenu");
  const sidebarOverlay = document.getElementById("sidebarOverlay");
  const closeBtn = document.getElementById("closeBtn");
  const settingsToggleBtn = document.getElementById("settingsToggleBtn");
  const settingsSubmenu = document.getElementById("settingsSubmenu");

  if (menuBtn && sideMenu && sidebarOverlay) {
    menuBtn.addEventListener("click", () => {
      sideMenu.classList.add("open");
      sidebarOverlay.classList.add("active");
    });
  }

  if (closeBtn && sideMenu && sidebarOverlay) {
    closeBtn.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      sidebarOverlay.classList.remove("active");
    });
  }

  if (sidebarOverlay && sideMenu) {
    sidebarOverlay.addEventListener("click", () => {
      sideMenu.classList.remove("open");
      sidebarOverlay.classList.remove("active");
    });
  }

  if (settingsToggleBtn && settingsSubmenu) {
    settingsToggleBtn.addEventListener("click", () => {
      settingsSubmenu.classList.toggle("open");
    });
  }
}

// -----------------------------
// HANDLE PAY0 RETURN & CREDIT WALLET
// -----------------------------
async function handlePay0Return() {
  const orderId = localStorage.getItem("pay0_last_order_id");
  const amountString = localStorage.getItem("pay0_last_amount");
  const amount = parseFloat(amountString || "0");

  if (!orderId) {
    console.warn("No stored Pay0 order id.");
    return;
  }

  try {
    const res = await fetch("/api/pay0-check-order-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ order_id: orderId }),
    });

    const data = await res.json();
    console.log("Pay0 status:", data);

    const status = data && data.result && data.result.txnStatus;

    if (data.status && status === "SUCCESS") {
      if (!currentUser) {
        alert(
          "Payment successful, but user is not logged in. Please login again."
        );
        return;
      }

      const userRef = db.collection("users").doc(currentUser.uid);
      const txRef = db.collection("transactions").doc(orderId);

      await db.runTransaction(async (tx) => {
        const userSnap = await tx.get(userRef);
        const oldBalance = userSnap.exists
          ? userSnap.data().balance || 0
          : 0;

        tx.set(
          userRef,
          {
            balance: oldBalance + amount,
          },
          { merge: true }
        );

        tx.set(
          txRef,
          {
            userId: currentUser.uid,
            type: "Credit",
            amount: amount,
            details: "Wallet recharge via Pay0",
            gateway: "pay0",
            status: "Success",
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      });

      alert(
        "Payment successful! ₹" + amount.toFixed(2) + " has been added to your wallet."
      );

      // Refresh balance display
      const refreshedSnap = await db
        .collection("users")
        .doc(currentUser.uid)
        .get();
      if (refreshedSnap.exists) {
        const newBalance = refreshedSnap.data().balance || 0;
        const balanceEl = document.getElementById("currentBalance");
        if (balanceEl) {
          balanceEl.textContent = "₹" + newBalance.toFixed(2);
        }
      }

      // Clear stored data
      localStorage.removeItem("pay0_last_order_id");
      localStorage.removeItem("pay0_last_amount");
    } else if (status === "FAILED" || status === "CANCELLED") {
      alert(
        "Payment failed or cancelled. If money was deducted from your bank, please contact support."
      );
      localStorage.removeItem("pay0_last_order_id");
      localStorage.removeItem("pay0_last_amount");
    } else {
      console.log("Payment pending or unknown status:", status);
    }
  } catch (err) {
    console.error("Error checking Pay0 status:", err);
    alert(
      "Could not verify payment status. If money was deducted, please contact support with screenshot."
    );
  }
}
