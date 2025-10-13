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
        
        // Load user data from Firestore
        loadUserBalance(user.uid);
        
        // Setup event listeners
        setupEventListeners(user);
        
        // Setup real-time updates
        setupRealTimeUpdates(user.uid);
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

    function loadUserBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const balanceElement = document.getElementById('profileBalance');
                
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
                } else {
                    balanceElement.textContent = '₹0.00';
                }
            }
        }).catch((error) => {
            console.error('Error loading balance:', error);
            document.getElementById('profileBalance').textContent = '₹0.00';
        });
    }

    function setupEventListeners(user) {
        // Recharge Button - FIXED
        const rechargeBtn = document.getElementById('rechargeBtn');
        if (rechargeBtn) {
            rechargeBtn.addEventListener('click', function(e) {
                e.preventDefault();
                console.log('Recharge button clicked');
                
                // Double check authentication
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) {
                    alert('Session expired. Please login again.');
                    window.location.href = 'login.html';
                    return;
                }
                
                console.log('Redirecting to recharge page');
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
            item.addEventListener('click', function(e) {
                e.preventDefault();
                alert('This feature is coming soon!');
            });
        });
    }

    function setupRealTimeUpdates(userId) {
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
            console.error('Real-time update error:', error);
        });
    }
});
