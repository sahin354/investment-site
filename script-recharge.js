document.addEventListener("DOMContentLoaded", function () {

    const amountInput = document.getElementById("rechargeAmount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");
    const rechargeForm = document.getElementById("rechargeForm");

    // Quick amount selection
    quickButtons.forEach((btn) => {
        btn.addEventListener("click", function () {
            quickButtons.forEach((b) => b.classList.remove("active"));
            this.classList.add("active");
            amountInput.value = this.getAttribute("data-amount");
        });
    });

    // Submit Recharge
    rechargeForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const amount = parseInt(amountInput.value || "0", 10);

        if (!amount || amount < 120) {
            alert("Minimum recharge amount is ₹120");
            return;
        }

        const customer_mobile =
            window.localStorage.getItem("userPhone") || "9999999999";

        try {
            // ⭐ FIXED: Correct API route for Vercel
            const res = await fetch("/api/pay0CreateOrder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount,
                    customer_mobile
                })
            });

            const data = await res.json();

            if (!res.ok || data.status === false) {
                console.log("Pay0 Error: ", data);
                alert(data.message || "Failed to create order.");
                return;
            }

            // Find Pay0 payment URL
            const paymentUrl =
                data.payment_url ||
                data.paymentURL ||
                (data.data && (data.data.payment_url || data.data.paymentURL));

            if (paymentUrl) {
                window.location.href = paymentUrl; // Redirect to Pay0
            } else {
                console.log("Full Response:", data);
                alert("Payment URL not received from Pay0.");
            }

        } catch (error) {
            console.error("Recharge Failed:", error);
            alert("Server error. Please try again.");
        }
    });
});
