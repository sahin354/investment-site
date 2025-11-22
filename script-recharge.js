// =============================
// Helper: get the amount input
// =============================
function getAmountInput() {
  return (
    document.getElementById("amount") ||               // common ID
    document.getElementById("rechargeAmount") ||       // another possible ID
    document.querySelector("input[name='amount']") ||  // fallback by name
    document.querySelector("input[name='rechargeAmount']")
  );
}

// ==================================
// Quick Select amount (global fn)
// ==================================
function setAmount(value) {
  const input = getAmountInput();
  if (!input) return;
  input.value = value;
}

// expose old-style global names in case your HTML uses onclick=""
window.setAmount = setAmount;
window.selectAmount = setAmount;

// ==================================
// Recharge handler (main function)
// ==================================
async function handleRecharge(event) {
  if (event && event.preventDefault) event.preventDefault();

  const amountInput = getAmountInput();
  if (!amountInput) {
    alert("Amount input not found on page.");
    return;
  }

  const raw = (amountInput.value || "").trim();
  const amount = Number(raw);

  if (!raw || isNaN(amount) || amount <= 0) {
    alert("Please enter a valid recharge amount.");
    return;
  }

  // Use same min / max as written on page
  if (amount < 120) {
    alert("Minimum deposit is ₹120.");
    return;
  }
  if (amount > 50000) {
    alert("Maximum deposit is ₹50,000.");
    return;
  }

  // ===============================
  // Get mobile (from localStorage)
  // ===============================
  let customerMobile = localStorage.getItem("userMobile");

  if (!customerMobile) {
    customerMobile = prompt("Enter your mobile number (10 digits):") || "";
    customerMobile = customerMobile.trim();
    if (!/^\d{10}$/.test(customerMobile)) {
      alert("Please enter a valid 10 digit mobile number.");
      return;
    }
    localStorage.setItem("userMobile", customerMobile);
  }

  try {
    const resp = await fetch("/api/pay0CreateOrder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: String(amount),
        customer_mobile: customerMobile
      })
    });

    let data;
    try {
      data = await resp.json();
    } catch (e) {
      alert("Server error: invalid response from backend.");
      return;
    }

    // If HTTP not OK or gateway returned status:false
    if (!resp.ok || data.status === false) {
      let msg = "Server error. Please try again.";
      if (data && data.message) {
        msg =
          typeof data.message === "string"
            ? data.message
            : JSON.stringify(data.message);
      }
      alert(msg);
      return;
    }

    // Try to find payment URL in different possible fields
    const payUrl =
      data.payment_url ||
      (data.data && (data.data.payment_url || data.data.pay_url)) ||
      data.redirect_url;

    if (!payUrl) {
      alert("Payment link not received from Pay0.");
      return;
    }

    // Finally redirect user to gateway
    window.location.href = payUrl;
  } catch (err) {
    alert("Network error: " + err.message);
  }
}

// expose global for inline onclick="handleRecharge()"
window.handleRecharge = handleRecharge;

// ==================================
// Attach click events on page load
// ==================================
document.addEventListener("DOMContentLoaded", () => {
  // 1) Quick Select buttons
  const quickButtons = document.querySelectorAll(
    // many possibilities so we don't break your layout
    "[data-amount], .quick-amount, .quick-select button, .amount-btn"
  );

  quickButtons.forEach((btn) => {
    const amtAttr =
      btn.dataset.amount ||
      btn.getAttribute("data-value") ||
      btn.innerText.replace(/[^\d]/g, "");
    if (!amtAttr) return;
    btn.addEventListener("click", () => setAmount(amtAttr));
  });

  // 2) Recharge button
  const rechargeBtn =
    document.getElementById("rechargeBtn") ||
    document.getElementById("btnRecharge") ||
    document.querySelector(".recharge-btn, button[data-action='recharge']");

  if (rechargeBtn) {
    rechargeBtn.addEventListener("click", handleRecharge);
  }
});
