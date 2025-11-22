document.addEventListener("DOMContentLoaded", () => {

    // ---------- GET ELEMENTS ----------
    const amountInput = document.getElementById("amount");
    const quickButtons = document.querySelectorAll(".quick-amount");
    const rechargeBtn = document.getElementById("recharge-btn");

    // ---------- QUICK SELECT AMOUNT ----------
    quickButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            amountInput.value = btn.dataset.amount;
        });
    });

    // ---------- RECHARGE BUTTON CLICK ----------
    rechargeBtn.addEventListener("click", async () => {

        const amount = amountInput.value.trim();
        const customer_mobile = localStorage.getItem("userMobile");

        // ---- Check mobile number ----
        if (!customer_mobile) {
            alert("Mobile number not found. Please login again.");
            return;
        }

        // ---- Validate amount ----
        if (!amount || isNaN(amount) || Number(amount) < 100) {
            alert("Enter a valid minimum ₹100 amount.");
            return;
        }

        rechargeBtn.disabled = true;
        rechargeBtn.innerText = "Processing...";

        try {
            // ---- API CALL TO YOUR BACKEND ----
            const response = await fetch("/api/pay0CreateOrder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    amount,
                    customer_mobile
                })
            });

            const result = await response.json();

            console.log("API Response:", result);

            // ---- If backend returned error ----
            if (!result.status) {
                alert("Error: " + JSON.stringify(result.message));
                rechargeBtn.disabled = false;
                rechargeBtn.innerText = "Recharge";
                return;
            }

            // ---- Open Pay0 Payment Page ----
            if (result.payment_url) {
                window.location.href = result.payment_url;
            } else {
                alert("Payment URL missing: " + JSON.stringify(result));
            }

        } catch (err) {
            alert("Server Error: " + err.message);
        }

        rechargeBtn.disabled = false;
        rechargeBtn.innerText = "Recharge";
    });

});
