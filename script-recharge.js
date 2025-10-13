// Recharge Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        
        console.log('User authenticated for recharge:', user.uid);
        initializeRechargePage(user);
    });

    function initializeRechargePage(user) {
        // Load current balance
        loadCurrentBalance(user.uid);
        
        // Setup event listeners
        setupRechargeListeners(user);
    }

    function loadCurrentBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.get().then((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const balanceElement = document.getElementById('currentBalance');
                
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
                }
            }
        }).catch((error) => {
            console.error('Error loading balance:', error);
        });
    }

    function setupRechargeListeners(user) {
        // Quick amount buttons
        const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                document.getElementById('rechargeAmount').value = amount;
                
                // Update active state
                quickAmountBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Proceed to recharge button
        const proceedBtn = document.getElementById('proceedRecharge');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Double check authentication
                const currentUser = firebase.auth().currentUser;
                if (!currentUser) {
                    alert('Session expired. Please login again.');
                    window.location.href = 'login.html';
                    return;
                }
                
                const amount = parseFloat(document.getElementById('rechargeAmount').value);
                
                if (!amount || amount <= 0) {
                    alert('Please enter a valid recharge amount');
                    return;
                }
                
                processRecharge(currentUser.uid, amount);
            });
        }
    }

    function processRecharge(userId, amount) {
        // Show loading state
        const proceedBtn = document.getElementById('proceedRecharge');
        const originalText = proceedBtn.textContent;
        proceedBtn.textContent = 'Processing...';
        proceedBtn.disabled = true;
        
        // Simulate recharge process (replace with your payment gateway integration)
        setTimeout(() => {
            // Update balance in Firestore
            const userDoc = firebase.firestore().collection('users').doc(userId);
            
            userDoc.get().then((doc) => {
                if (doc.exists) {
                    const currentBalance = doc.data().balance || 0;
                    const newBalance = currentBalance + amount;
                    
                    return userDoc.update({
                        balance: newBalance,
                        lastRecharge: firebase.firestore.FieldValue.serverTimestamp(),
                        rechargeHistory: firebase.firestore.FieldValue.arrayUnion({
                            amount: amount,
                            timestamp: new Date(),
                            status: 'completed'
                        })
                    });
                } else {
                    return userDoc.set({
                        balance: amount,
                        lastRecharge: firebase.firestore.FieldValue.serverTimestamp(),
                        rechargeHistory: [{
                            amount: amount,
                            timestamp: new Date(),
                            status: 'completed'
                        }]
                    });
                }
            }).then(() => {
                alert(`Successfully recharged ₹${amount}!`);
                proceedBtn.textContent = originalText;
                proceedBtn.disabled = false;
                
                // Redirect back to mine page
                window.location.href = 'mine.html';
            }).catch((error) => {
                console.error('Recharge error:', error);
                alert('Recharge failed. Please try again.');
                proceedBtn.textContent = originalText;
                proceedBtn.disabled = false;
            });
        }, 2000);
    }
});
