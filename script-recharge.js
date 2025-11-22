// ------------------------
//  RECHARGE PAGE SCRIPT
// ------------------------

document.addEventListener("DOMContentLoaded", () => {

    const amountInput = document.getElementById("rechargeAmount");
    const quickButtons = document.querySelectorAll(".quick-amount-btn");
    const rechargeForm = document.getElementById("rechargeForm");
    const balanceDisplay = document.getElementById("currentBalance");

    let currentUser = null;

    // -------------------------
    // 1. GET CURRENT USER BALANCE
    // -------------------------
    firebase.auth().onAuthStateChanged(async user => {
        if (!user) {
            console.warn("No user logged in");
            return;
        }

        currentUser = user;

        try {
            const userDoc = await firebase.firestore()
                .collection("users")
                .doc(user.uid)
                .get();

            const bal = userDoc.data().balance || 0;
            balanceDisplay.textContent = "₹" + bal.toFixed(2);

        } catch (err) {
            console.error("Error fetching balance:", err);
        }
    });


    // ----------------------------------------
    // 2. QUICK SELECT BUTTONS (FIXED SELECTION)
    // ----------------------------------------
    quickButtons.forEach(btn => {
        btn.addEventListener("click", () => {

            // remove active from all
            quickButtons.forEach(b => b.classList.remove("active"));

            // activate selected
            btn.classList.add("active");

            // set amount in input
            const amt = btn.dataset.amount;
            amountInput.value = amt;
        });
    });


    // ------------------------------------
    // 3. SUBMIT RECHARGE → OPEN PAY PAGE
    // ------------------------------------
    rechargeForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const amount = amountInput.value.trim();
    if (!amount || Number(amount) < 120) {
        alert("Minimum recharge amount is ₹120");
        return;
    }

    window.open(`/api/pay0CreateOrder?amount=${amount}`, "_blank");
});

        // --------------------------
        // FIX 404: correct API route
        // --------------------------
        const url = `/api/pay0-create-order?amount=${amount}`;

        // open in new tab
        window.open(url, "_blank");
    });

});
