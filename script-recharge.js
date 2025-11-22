document.addEventListener("DOMContentLoaded", () => {
    const quickButtons = document.querySelectorAll(".quick-amount");
    const amountInput = document.getElementById("amount");
    const rechargeBtn = document.getElementById("recharge-btn");

    // Quick Select Buttons
    quickButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            amountInput.value = btn.dataset.amount;
        });
    });

    // Recharge Button Click
    rechargeBtn.addEventListener("click", async () => {
        const amount = amountInput.value.trim();
        const customer_mobile = localStorage.getItem("userMobile");

        if (!customer_mobile) {
            alert("Please login again. Mobile number missing.");
            return;
        }

        if (!amount || amount < 100) {
            alert("Enter a valid amount (min ₹100)");
            return;
        }

        try {
            const response = await fetch("/api/pay0CreateOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount, customer_mobile })
            });

            const result = await response.json();

            if (!result.status) {
                alert("Recharge failed: " + JSON.stringify(result.message));
                return;
            }

            // PAY0 gives payment URL
            if (result.payment_url) {
                window.location.href = result.payment_url;
            } else {
                alert("Payment URL missing. Response: " + JSON.stringify(result));
            }

        } catch (err) {
            alert("Server Error: " + err.message);
        }
    });
});
