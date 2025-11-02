// DELETE everything in your old script-recharge.js and REPLACE it with this.

document.addEventListener('DOMContentLoaded', function() {
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            console.log('User not authenticated, redirecting to login');
            window.location.href = 'login.html';
            return;
        }
        initializeRechargePage(user);
    });

    function initializeRechargePage(user) {
        // Load current balance
        loadCurrentBalance(user.uid);
        
        // Setup event listeners
        setupRechargeListeners();
    }

    function loadCurrentBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const balanceElement = document.getElementById('currentBalance'); // In recharge.html
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
                }
                const rechargeBalance = document.getElementById('currentBalanceAmount'); // In common.js
                if (rechargeBalance && userData.balance !== undefined) {
                    rechargeBalance.textContent = `₹${userData.balance.toFixed(2)}`;
                }
            }
        }, (error) => {
            console.error('Error loading balance:', error);
        });
    }

    function setupRechargeListeners() {
        // Quick amount buttons
        const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                document.getElementById('rechargeAmount').value = amount;
                
                quickAmountBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });

        // Proceed to recharge button
        const proceedBtn = document.getElementById('proceedRecharge');
        if (proceedBtn) {
            proceedBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                const amount = parseFloat(document.getElementById('rechargeAmount').value);
                
                if (!amount || amount <= 0) {
                    alert('Please enter a valid recharge amount');
                    return;
                }
                
                // --- NEW CODE ---
                // Store the amount in localStorage
                localStorage.setItem('rechargeAmount', amount);
                
                // Set a 10-minute timer
                const paymentEndTime = Date.now() + (10 * 60 * 1000);
                localStorage.setItem('paymentEndTime', paymentEndTime);
                // --- END NEW CODE ---
                
                // Redirect to the new payment page
                window.location.href = 'payment.html';
            });
        }
    }
});
