document.addEventListener("DOMContentLoaded", () => {

    // -----------------------------
    // FIND ELEMENTS BASED ON YOUR HTML
    // -----------------------------
    const amountInput = document.getElementById("rechargeAmount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");
    const rechargeBtn = document.querySelector(".submit-btn"); // YOUR REAL BUTTON

    if (!amountInput) {
        console.error("Amount input not found");
        return;
    }

    // -----------------------------
    // QUICK SELECT BUTTONS
    // -----------------------------
    quickButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const amt = btn.dataset.amount;
            amountInput.value = amt;
        });
    });

    // -----------------------------
    // RECHARGE BUTTON CLICK
    // -----------------------------
    rechargeBtn.addEventListener("click", async (e) => {
        e.preventDefault();

        let amount = amountInput.value.trim();
        let mobile = localStorage.getItem("userMobile");

        if (!amount || amount < 120) {
            alert("Minimum recharge amount is ₹120");
            return;
        }

        if (!mobile) {
            const input = prompt("Enter your mobile number:");
            if (!input || input.length < 10) {
                alert("Please enter valid mobile number");
                return;
            }
            mobile = input;
            localStorage.setItem("userMobile", mobile);
        }

        rechargeBtn.innerText = "Processing...";
        rechargeBtn.disabled = true;

        try {
            const res = await fetch("/api/pay0CreateOrder", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: amount,
                    customer_mobile: mobile
                })
            });

            const data = await res.json();
            console.log("Pay0 reply:", data);

            if (!data.status) {
                alert("Error: " + JSON.stringify(data.message));
                rechargeBtn.innerText = "Proceed to Recharge";
                rechargeBtn.disabled = false;
                return;
            }

            // Payment URL may come in different formats from Pay0
            const paymentUrl =
                data.payment_url ||
                (data.data && data.data.payment_url) ||
                data.result?.payment_url;

            if (!paymentUrl) {
                alert("Payment URL missing!");
                rechargeBtn.innerText = "Proceed to Recharge";
                rechargeBtn.disabled = false;
                return;
            }

            // Redirect to Pay0
            window.location.href = paymentUrl;

        } catch (err) {
            alert("Server error: " + err.message);
        }

        rechargeBtn.innerText = "Proceed to Recharge";
        rechargeBtn.disabled = false;
    });

});
