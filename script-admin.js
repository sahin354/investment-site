// script-admin.js
const db = firebase.firestore();

// Make sure only admins can see this page
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (!doc.data().isAdmin) {
                // If not an admin, kick them out
                window.location.replace('index.html');
            } else {
                // If they are an admin, load the data
                loadPendingWithdrawals();
                loadPendingRecharges();
            }
        });
    } else {
        window.location.replace('login.html');
    }
});

function loadPendingWithdrawals() {
    const list = document.getElementById('pending-withdrawals-list');
    db.collection('withdrawals').where('status', '==', 'pending').onSnapshot(snapshot => {
        list.innerHTML = ''; // Clear list
        snapshot.forEach(doc => {
            const req = doc.data();
            list.innerHTML += `<div class="record">
                <p>User: ${req.userId}</p>
                <p>Amount: ₹${req.amount}</p>
                <button onclick="approveWithdrawal('${doc.id}')">Approve</button>
            </div>`;
        });
    });
}

// You need to write the logic for approveWithdrawal, reject, etc.
// This would involve updating the 'withdrawals' document status
// AND updating the user's balance in the 'users' document.
function approveWithdrawal(docId) {
    // 1. Get the withdrawal request
    // 2. Get the user ID from the request
    // 3. Update the withdrawal status to 'success'
    // 4. IMPORTANT: Deduct the amount from the user's withdrawalBalance
    console.log(`Approving withdrawal ${docId}`);
}

// Similarly, create a function for managing recharges
function loadPendingRecharges() { /* ... */ }
