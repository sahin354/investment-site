// ---------------------------
// 1. Get elements
// ---------------------------
const amountInput = document.getElementById("amount");
const rechargeBtn = document.getElementById("rechargeBtn");
const quickButtons = document.querySelectorAll(".quick-amount");

let selectedAmount = 0;

// ---------------------------
// 2. Quick Amount Buttons
// ---------------------------
quickButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectedAmount = parseInt(btn.dataset.amount);
    amountInput.value = selectedAmount;
  });
});

// ---------------------------
// 3. Main Recharge Action
// ---------------------------
rechargeBtn.addEventListener("click", async () => {
  let amount = parseInt(amountInput.value);

  if (!amount || amount < 100) {
    alert("Minimum recharge amount is ₹100");
    return;
  }

  rechargeBtn.disabled = true;
  rechargeBtn.textContent = "Processing...";

  try {
    // ---------------------------
    // 4. Get Logged-In User
    // ---------------------------
    const user = supabase.auth.getUser
      ? (await supabase.auth.getUser()).data.user
      : null;

    if (!user) {
      alert("Please login again.");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      return;
    }

    const mobile = user.phone || "9999999999";
    const orderId = "ORD" + Date.now();

    // ---------------------------
    // 5. CALL BACKEND → PAY0 CREATE ORDER
    // ---------------------------
    const response = await fetch("/api/pay0-create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        customer_name: user.email || "User",
        customer_mobile: mobile,
        order_id: orderId,
      })
    });

    // Read RAW server response
    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      // 🔥 Debug popup (shows EXACT error from Vercel backend)
      alert("SERVER RAW RESPONSE:\n\n" + rawText);

      console.error("Server responded with non-JSON:", rawText);

      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      return;
    }

    // Backend returned an error object
    if (!response.ok || data.ok === false) {
      alert("API ERROR:\n" + (data.message || "Unknown error from backend"));
      console.error("API Error:", data);

      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      return;
    }

    if (!data.paymentUrl) {
      alert("Payment URL missing from server response.");
      rechargeBtn.disabled = false;
      rechargeBtn.textContent = "Proceed to Recharge";
      return;
    }

    // ---------------------------
    // 6. Redirect to Payment Page
    // ---------------------------
    window.location.href = data.paymentUrl;

  } catch (err) {
    console.error("Recharge error:", err);
    alert("Something went wrong. Please try again.");

  } finally {
    rechargeBtn.disabled = false;
    rechargeBtn.textContent = "Proceed to Recharge";
  }
}); 
