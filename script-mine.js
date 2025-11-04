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
        
        // --- NEW: Load transaction history ---
        loadTransactionHistory(user.uid);
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

    // Renamed this function for clarity
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
        // Recharge Button - FIXED
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
            item.addEventListener('click', function(e) {
                e.preventDefault();
                alert('This feature is coming soon!');
            });
        });
    }

    /**
     * --- NEW: loadTransactionHistory Function ---
     * Loads the last 10 transactions for the user.
     */
    function loadTransactionHistory(userId) {
        const listContainer = document.getElementById('transactionList');
        const db = firebase.firestore();
        
        const txQuery = db.collection('transactions')
                          .where('userId', '==', userId)
                          .orderBy('timestamp', 'desc')
                          .limit(10);
                          
        txQuery.onSnapshot((snapshot) => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            listContainer.innerHTML = ''; // Clear loading message
            snapshot.forEach(doc => {
                const tx = doc.data();
                const amount = tx.amount;
                const date = tx.timestamp ? tx.timestamp.toDate().toLocaleString() : 'Just now';
                
                // --- This is the new HTML for a transaction item ---
                const txHTML = `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <span class="transaction-type">${tx.type}</span>
                            <span class="transaction-info">${tx.details}</span>
                        </div>
                        <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                            ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                            <span class="transaction-date">${date}</span>
                        </div>
                    </div>
                `;
                listContainer.innerHTML += txHTML;
            });
            
        }, (error) => {
            console.error("Error loading transactions:", error);
            listContainer.innerHTML = '<p style="color:red;">Error loading history.</p>';
        });
    }
});
                           
