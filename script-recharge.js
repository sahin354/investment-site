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
        loadCurrentBalance(user.uid);
        setupRechargeListeners();
    }

    function loadCurrentBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.onSnapshot((doc) => {
            if (doc.exists) {
                const userData = doc.data();
                const balanceElement = document.getElementById('currentBalance'); 
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
                }
                const rechargeBalance = document.getElementById('currentBalanceAmount');
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

        // --- NEW CODE: Listen to the FORM submit ---
        const rechargeForm = document.getElementById('rechargeForm');
        if (rechargeForm) {
            rechargeForm.addEventListener('submit', function(e) {
                
                const amount = parseFloat(document.getElementById('rechargeAmount').value);
                
                if (!amount || amount <= 0) {
                    alert('Please enter a valid recharge amount');
                    // Stop the form from submitting and opening a new tab
                    e.preventDefault(); 
                    return;
                }
                
                // --- Save data to localStorage ---
                // The new tab will read this data
                localStorage.setItem('rechargeAmount', amount);
                
                const paymentEndTime = Date.now() + (10 * 60 * 1000); // 10 minutes
                localStorage.setItem('paymentEndTime', paymentEndTime);
                
                // We DO NOT call e.preventDefault() here.
                // We let the form submit, which opens payment.html in a new tab.
            });
        }
    }
});
