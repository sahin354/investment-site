document.addEventListener('DOMContentLoaded', () => {
    const profileIdEl = document.getElementById('profileId');
    const profileEmailEl = document.getElementById('profileEmail');
    const profileBalanceEl = document.getElementById('profileBalance');
    const logoutBtn = document.getElementById('logoutBtn');
    const rechargeBtn = document.getElementById('rechargeBtn');
    
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            firebase.firestore().collection('users').doc(user.uid).onSnapshot(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    profileIdEl.textContent = `ID: ${userData.userId || 'N/A'}`;
                    profileEmailEl.textContent = userData.email || user.email;
                    profileBalanceEl.textContent = `₹${(userData.balance || 0).toFixed(2)}`;
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    if (rechargeBtn) {
        rechargeBtn.addEventListener('click', () => {
            window.location.href = 'recharge.html';
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'login.html';
            });
        });
    }
});

// Fix recharge button event listener
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
            return;
        }
        
        // User is signed in, proceed with page setup
        setupMinePage(user);
    });

    function setupMinePage(user) {
        // Recharge button with proper authentication
        const rechargeBtn = document.getElementById('rechargeBtn');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Check if user is still authenticated
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) {
                    alert('Please log in again');
                    window.location.href = 'login.html';
                    return;
                }
                
                // Redirect to recharge page
                window.location.href = 'recharge.html';
            });
        }

        // Withdraw button
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', function() {
                alert('Withdraw functionality coming soon!');
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                firebase.auth().signOut().then(() => {
                    window.location.href = 'login.html';
                });
            });
        }
    }
});
