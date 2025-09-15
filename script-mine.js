// script-mine.js
auth.onAuthStateChanged(user => {
    if (user) {
        // Populate user data
        const userRef = db.collection('users').doc(user.uid);
        userRef.onSnapshot(doc => { // Use onSnapshot for real-time updates
            if (doc.exists) {
                const data = doc.data();
                document.getElementById('userName').textContent = data.fullName;
                document.getElementById('userMobile').textContent = data.phone;
                document.getElementById('rechargeBalance').textContent = data.rechargeBalance;
                document.getElementById('withdrawalBalance').textContent = data.withdrawalBalance;
            }
        });
    }
});

// Logout button
document.getElementById('logoutBtn').addEventListener('click', () => {
    logout(); // This function is in script.js
});

// Withdrawal Logic
document.getElementById('withdrawBtn').addEventListener('click', () => {
    const amount = Number(document.getElementById('withdrawAmount').value);
    if (amount < 119) {
        alert("Minimum withdrawal is ₹119.");
        return;
    }

    if (currentUser) {
        // You would first check if the user has enough withdrawalBalance
        // For simplicity, we just create the request
        const tds = amount * 0.19;
        const finalAmount = amount - tds;

        db.collection('withdrawals').add({
            userId: currentUser.uid,
            amount: amount,
            tds: tds,
            finalAmount: finalAmount,
            status: 'pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert('Withdrawal request submitted!');
        });
    }
});
