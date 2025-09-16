document.addEventListener('DOMContentLoaded', () => {
    // Get all the elements from the page that we need to work with
    const profileIdEl = document.getElementById('profileId');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileBalanceEl = document.getElementById('profileBalance');
    const logoutBtn = document.getElementById('logoutBtn');
    const rechargeBtn = document.getElementById('rechargeBtn');
    
    // Listen for changes in authentication state (e.g., user logs in or out)
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // If a user is logged in, fetch their data from Firestore
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    // Display the user's data on the page
                    profileIdEl.textContent = `ID: ${userData.userId || 'N/A'}`;
                    profileEmailEl.textContent = userData.email || user.email;
                    profileBalanceEl.textContent = `₹${(userData.balance || 0).toFixed(2)}`;
                } else {
                    console.error("User document not found in Firestore!");
                }
            }).catch(error => {
                console.error("Error fetching user data:", error);
            });
        } else {
            // If no user is logged in, redirect them to the login page
            console.log("No user signed in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });

    // --- LOGOUT BUTTON LOGIC ---
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                // Sign-out successful.
                console.log('User signed out successfully.');
                window.location.href = 'login.html'; // Redirect to login page
            }).catch((error) => {
                // An error happened.
                console.error('Sign out error:', error);
                alert('Error signing out. Please try again.');
            });
        });
    }
    
    // --- OTHER BUTTONS ---
    if(rechargeBtn) {
        rechargeBtn.addEventListener('click', () => {
            window.location.href = 'recharge.html'; // Redirect to the recharge page
        });
    }
});
