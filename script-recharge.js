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
        const amountInput = document.getElementById('rechargeAmount'); // Get the input field
        
        quickAmountBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const amount = this.getAttribute('data-amount');
                amountInput.value = amount; // Set the input field's value
                
                quickAmountBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
            });
        });
        
        // Remove active class from buttons if user types manually
        amountInput.addEventListener('input', () => {
             quickAmountBtns.forEach(b => b.classList.remove('active'));
        });

        // --- UPDATED: Listen to the FORM submit ---
        const rechargeForm = document.getElementById('rechargeForm');
        if (rechargeForm) {
            rechargeForm.addEventListener('submit', function(e) {
                
                const amount = parseFloat(amountInput.value);
                
                // --- NEW VALIDATION BLOCK ---
                if (isNaN(amount) || amount <= 0) {
                    alert('Please enter a valid recharge amount.');
                    e.preventDefault(); // Stop the form from submitting
                    return;
                }
                
                if (amount < 120) {
                    // Show red alert
                    alert('Minimum deposit amount is ₹120.');
                    e.preventDefault(); // Stop the form from submitting
                    return;
                }
                
                if (amount > 50000) {
                    // Show red alert
                    alert('Maximum deposit amount is ₹50000.');
                    e.preventDefault(); // Stop the form from submitting
                    return;
                }
                // --- END OF NEW VALIDATION BLOCK ---
                
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
