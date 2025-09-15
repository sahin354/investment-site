// script-recharge.js
document.querySelectorAll('.channel-btn').forEach(button => {
    button.addEventListener('click', () => {
        const amount = document.getElementById('rechargeAmount').value;
        if (amount < 100) {
            alert("Minimum recharge amount is ₹100.");
            return;
        }
        
        // In a real app, this would redirect to a payment gateway.
        // For now, we'll just create a record in Firestore.
        if (currentUser) {
            db.collection('recharges').add({
                userId: currentUser.uid,
                amount: Number(amount),
                channel: button.dataset.channel,
                status: 'pending', // Admin will change this to 'success'
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                alert(`Recharge request for ₹${amount} submitted!`);
            });
        }
    });
});
