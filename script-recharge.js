// This script handles the recharge page functionality.
document.addEventListener('DOMContentLoaded', () => {
    const rechargeAmountInput = document.getElementById('rechargeAmount');
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    const submitRechargeBtn = document.getElementById('submitRecharge');
    const db = firebase.firestore();
    let currentUser = null;

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
        } else {
            window.location.href = 'login.html';
        }
    });

    quickAmountBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelector('.quick-amount-btn.active')?.classList.remove('active');
            btn.classList.add('active');
            rechargeAmountInput.value = btn.dataset.amount;
        });
    });

    submitRechargeBtn.addEventListener('click', () => {
        const amount = parseInt(rechargeAmountInput.value);
        if (!currentUser) return alert('You are not logged in!');
        if (!amount || amount < 100) return alert('Please enter an amount of at least ₹100.');

        const userRef = db.collection('users').doc(currentUser.uid);
        
        // This is the updated part
        userRef.update({
            balance: firebase.firestore.FieldValue.increment(amount),
            totalRechargeAmount: firebase.firestore.FieldValue.increment(amount) // <-- New field updated here
        }).then(() => {
            alert(`Recharge of ₹${amount} successful!`);
            rechargeAmountInput.value = '';
            document.querySelector('.quick-amount-btn.active')?.classList.remove('active');
        }).catch(error => {
            console.error("Error during recharge:", error);
            alert("Recharge failed. Please try again.");
        });
    });
});
