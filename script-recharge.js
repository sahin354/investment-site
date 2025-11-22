// script-recharge.js
// Recharge page frontend logic (no layout changes)

document.addEventListener("DOMContentLoaded", () => {
  console.log("[recharge] script loaded");

  // --------- Find elements safely ----------
  const amountInput =
    document.getElementById("rechargeAmount") ||
    document.querySelector("input[name='rechargeAmount']") ||
    document.querySelector("#amount") ||
    document.querySelector("input[type='number']");

  const quickButtons =
    document.querySelectorAll(".quick-amount-btn, [data-amount]");

  const rechargeForm = document.getElementById("rechargeForm");
  const rechargeButton =
    document.getElementById("rechargeSubmitBtn") ||
    document.getElementById("rechargeButton") ||
    document.querySelector("button[data-role='recharge-submit']");

  if (!amountInput) {
    console.warn("[recharge] Amount input not found");
  }

  // --------- Quick select buttons ----------
  if (quickButtons && quickButtons.length) {
    quickButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const amt = btn.getAttribute("data-amount");
        if (!amt) return;

        if (amountInput) {
          amountInput.value = amt;
        }

        // highlight selected button
        quickButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
      });
    });
  } else {
    console.warn("[recharge] No quick amount buttons found");
  }

  // --------- Helper: get user mobile ----------
  function getCustomerMobile() {
    // Try localStorage keys you might be using
    const fromLocalStorage =
      localStorage.getItem("userMobile") ||
      localStorage.getItem("phone") ||
      localStorage.getItem("mobile");

    if (fromLocalStorage) return fromLocalStorage;

    // Or from any element showing mobile on the page
    const el =
      document.getElementById("userMobile") ||
      document.querySelector("[data-user-mobile]");
    if (el) return (el.textContent || el.innerText || "").trim();

    return "";
  }

  // --------- Main submit handler ----------
  async function handleRechargeSubmit(event) {
    if (event) event.preventDefault();

    if (!amountInput) {
      alert("Amount input not found on page.");
      return;
    }

    const amountValue = amountInput.value.trim();
    const amount = Number(amountValue);

    if (!amountValue || isNaN(amount) || amount < 120) {
      alert("Minimum recharge amount is ₹120.");
      return;
    }

    const customerMobile = getCustomerMobile();

    if (!customerMobile) {
      alert(
        "Could not find your mobile number. Please log-in again or save mobile in localStorage (key: userMobile)."
      );
      return;
    }

    try {
      console.log("[recharge] Creating Pay0 order…", {
        amount,
        customer_mobile: customerMobile,
      });

      const response = await fetch("/api/pay0CreateOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          customer_mobile: customerMobile,
        }),
      });

      const data = await response.json().catch(() => ({}));

      console.log("[recharge] API response:", response.status, data);

      if (!response.ok || data.status === false) {
        const msg =
          (data && (data.message || data.error)) ||
          "Server error. Please try again.";
        alert(msg);
        return;
      }

      // Pay0 usually returns a payment_url
      const paymentUrl =
        data.payment_url ||
        (data.data && data.data.payment_url) ||
        data.url;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        alert("Order created but payment URL not found.");
      }
    } catch (err) {
      console.error("[recharge] Fetch error:", err);
      alert("Server error. Please try again.");
    }
  }

  // --------- Attach listeners ----------
  if (rechargeForm) {
    rechargeForm.addEventListener("submit", handleRechargeSubmit);
  }

  if (rechargeButton) {
    rechargeButton.addEventListener("click", handleRechargeSubmit);
  }

  if (!rechargeForm && !rechargeButton) {
    console.warn(
      "[recharge] No form/button found to submit recharge. " +
        "Make sure there is a form#rechargeForm or a button with id 'rechargeSubmitBtn'."
    );
  }
});
