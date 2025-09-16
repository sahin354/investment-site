document.addEventListener('DOMContentLoaded', () => {
    const rechargeAmountInput = document.getElementById('rechargeAmount');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const currentBalanceEl = document.getElementById('currentBalance');

    // Update input when a quick amount button is clicked
    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            quickAmountBtns.forEach(b => b.classList.remove('active'));
            // Add active class to the clicked button
            btn.classList.add('active');
            // Set the input value
            rechargeAmountInput.value = btn.dataset.amount;
        });
    });

    // Fetch and display current balance
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const balance = doc.data().balance || 0;
                    if(currentBalanceEl) {
                        currentBalanceEl.textContent = `₹${balance.toFixed(2)}`;
                    }
                }
            });
        } else {
            window.location.href = 'login.html'; // Redirect if not logged in
        }
    });

    // Add logic for the 'Proceed to Pay' button here
    const submitRechargeBtn = document.getElementById('submitRecharge');
    submitRechargeBtn.addEventListener('click', () => {
        const amount = rechargeAmountInput.value;
        if (amount && amount >= 100) {
            alert(`Proceeding to pay ₹${amount}`);
            // TODO: Add your payment gateway logic here
        } else {
            alert('Please enter an amount of at least ₹100.');
        }
    });
});
