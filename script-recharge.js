// This is the corrected script for the recharge page.
document.addEventListener('DOMContentLoaded', () => {
    const rechargeAmountInput = document.getElementById('rechargeAmount');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const submitRechargeBtn = document.getElementById('submitRecharge');
    const db = firebase.firestore();

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // --- User is confirmed to be logged in ---
            // Now we can safely set up the rest of the page.
            
            const currentUser = user;

            // Activate the quick amount buttons
            quickAmountBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelector('.quick-amount-btn.active')?.classList.remove('active');
                    btn.classList.add('active');
                    rechargeAmountInput.value = btn.dataset.amount;
                });
            });

            // Activate the submit recharge button
            submitRechargeBtn.addEventListener('click', () => {
                const amount = parseInt(rechargeAmountInput.value);
                if (!amount || amount < 100) return alert('Please enter an amount of at least ₹100.');

                const userRef = db.collection('users').doc(currentUser.uid);
                
                userRef.update({
                    balance: firebase.firestore.FieldValue.increment(amount),
                    totalRechargeAmount: firebase.firestore.FieldValue.increment(amount)
                }).then(() => {
                    alert(`Recharge of ₹${amount} successful!`);
                    rechargeAmountInput.value = '';
                    document.querySelector('.quick-amount-btn.active')?.classList.remove('active');
                }).catch(error => {
                    console.error("Error during recharge:", error);
                    alert("Recharge failed. Please try again.");
                });
            });

        } else {
            // --- User is confirmed to be logged out ---
            // Now it is safe to redirect to the login page.
            window.location.href = 'login.html';
        }
    });
});
                          
