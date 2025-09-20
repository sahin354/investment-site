// This script handles the "My Account" page functionality.
document.addEventListener('DOMContentLoaded', () => {
    // Get all the elements we need to work with
    const profileIdEl = document.getElementById('profileId');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileBalanceEl = document.getElementById('profileBalance');
    const logoutBtn = document.getElementById('logoutBtn');
    const rechargeBtn = document.getElementById('rechargeBtn');
    
    // Check if a user is logged in and display their data
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // Use onSnapshot for real-time updates of the balance
            firebase.firestore().collection('users').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    profileIdEl.textContent = `ID: ${userData.userId || 'N/A'}`;
                    profileEmailEl.textContent = userData.email || user.email;
                    profileBalanceEl.textContent = `₹${(userData.balance || 0).toFixed(2)}`;
                }
            });
        } else {
            // If no user is signed in, redirect to login
            window.location.href = 'login.html';
        }
    });

    // --- Button Logic ---

    // Logic for the Recharge Button
    if (rechargeBtn) {
        rechargeBtn.addEventListener('click', () => {
            // This correctly takes the user to the recharge page
            window.location.href = 'recharge.html';
        });
    }

    // Logic for the Log Out Button
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // This correctly signs the user out and redirects to the login page
            firebase.auth().signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
    }
});
