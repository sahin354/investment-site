document.addEventListener("DOMContentLoaded", function () {
    const amountInput = document.getElementById("rechargeAmount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");
    const rechargeForm = document.getElementById("rechargeForm");

    // Handle Quick Select Buttons
    quickButtons.forEach(btn => {
        btn.addEventListener("click", function () {

            quickButtons.forEach(b => b.classList.remove("active"));

            this.classList.add("active");

            amountInput.value = this.getAttribute("data-amount");
        });
    });

    // Handle Recharge Submission
    rechargeForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const amount = amountInput.value.trim();

        if (!amount || Number(amount) < 120) {
            alert("Minimum recharge amount is ₹120");
            return;
        }

        // ⭐ Your correct API route
        const apiURL = `/api/pay0-create-order?amount=${amount}`;

        // Open in new tab
        window.open(apiURL, "_blank");
    });
});
