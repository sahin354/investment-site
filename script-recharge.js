// script-recharge.js

document.addEventListener("DOMContentLoaded", function () {
    const amountInput = document.getElementById("rechargeAmount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");
    const rechargeForm = document.getElementById("rechargeForm");

    // Quick amount selection (keep same UI)
    quickButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            quickButtons.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            amountInput.value = this.getAttribute("data-amount");
        });
    });

    // Handle form submit
    rechargeForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const amount = parseInt(amountInput.value || "0", 10);

        if (!amount || amount < 120) {
            alert("Minimum recharge amount is ₹120");
            return;
        }

        // You can replace this with real logged-in mobile if you store it
        const customer_mobile =
            window.localStorage.getItem("userPhone") || "9999999999";

        try {
            const res = await fetch("/api/pay0CreateOrder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ amount, customer_mobile }),
            });

            const data = await res.json();

            if (!res.ok || data.status === false) {
                alert(data.message || "Failed to create order.");
                return;
            }

            // Try to find payment URL in Pay0 response
            const paymentUrl =
                data.payment_url ||
                data.paymentURL ||
                (data.data && (data.data.payment_url || data.data.paymentURL));

            if (paymentUrl) {
                // Redirect user to Pay0 payment page
                window.location.href = paymentUrl;
            } else {
                console.log("Pay0 response:", data);
                alert("Payment URL not received from gateway.");
            }
        } catch (err) {
            console.error("Recharge error:", err);
            alert("Server error. Please try again.");
        }
    });
});
