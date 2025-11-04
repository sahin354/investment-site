// Mine Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('User authenticated:', user.uid);
        initializeMinePage(user);
    });

    function initializeMinePage(user) {
        // Update user info
        updateProfileInfo(user);
        
        // Setup event listeners
        setupEventListeners(user);
        
        // Setup real-time balance updates
        setupRealTimeBalance(user.uid);
    }

    function updateProfileInfo(user) {
        const profileId = document.getElementById('profileId');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileId) {
            profileId.textContent = `ID: ${user.uid.substring(0, 10)}...`;
        }
        if (profileEmail) {
            profileEmail.textContent = user.email || 'No email available';
        }
    }

    function setupRealTimeBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const balanceElement = document.getElementById('profileBalance');
                
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
                    console.log('Balance updated in real-time:', userData.balance);
                }
            }
        }, (error) => {
            console.error('Real-time balance update error:', error);
            document.getElementById('profileBalance').textContent = '₹0.00';
        });
    }

    function setupEventListeners(user) {
        // Recharge Button
        const rechargeBtn = document.getElementById('rechargeBtn');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = 'recharge.html';
            });
        }

        // Withdraw Button
        const withdrawBtn = document.getElementById('withdrawBtn');
        if (withdrawBtn) {
            withdrawBtn.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Withdraw functionality will be available soon!');
            });
        }

        // Logout Button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function(e) {
                e.preventDefault();
                firebase.auth().signOut().then(() => {
                    console.log('User signed out');
                    window.location.href = 'login.html';
                }).catch((error) => {
                    console.error('Sign out error:', error);
                });
            });
        }

        // Other option items
        const optionItems = document.querySelectorAll('.option-item');
        optionItems.forEach(item => {
            // Check if the item has a real link
            const link = item.getAttribute('href');
            if (link === '#') {
                // Only add "coming soon" to items that are still '#'
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    alert('This feature is coming soon!');
                });
            }
            // Items with real links (like transactions.html) will just work
        });
    }
    
    // --- The loadTransactionHistory() function is GONE ---
    // It is no longer needed on this page.
});
