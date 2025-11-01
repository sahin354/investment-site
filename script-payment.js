document.addEventListener('DOMContentLoaded', function() {
    let currentUser;
    let rechargeAmount;

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            currentUser = user;
            loadPaymentPage();
        }
    });

    function loadPaymentPage() {
        // 1. Get amount from localStorage
        rechargeAmount = localStorage.getItem('rechargeAmount');
        if (!rechargeAmount) {
            alert('Amount not set. Redirecting to recharge page.');
            window.location.href = 'recharge.html';
            return;
        }

        const amountNum = parseFloat(rechargeAmount);
        document.getElementById('payableAmount').textContent = `₹ ${amountNum.toFixed(2)}`;
        document.getElementById('amountToCopy').value = amountNum.toFixed(2);

        // 2. Load UPI details from Firestore (set by admin)
        loadPaymentDetails();

        // 3. Add listeners
        setupListeners();
    }

    async function loadPaymentDetails() {
        try {
            const doc = await firebase.firestore().collection('system_config').doc('payment_details').get();
            if (doc.exists && doc.data().upiId) {
                document.getElementById('upiToCopy').value = doc.data().upiId;
            } else {
                document.getElementById('upiToCopy').value = 'Error: Admin has not set a UPI ID.';
            }
        } catch (err) {
            console.error("Error loading payment details:", err);
            document.getElementById('upiToCopy').value = 'Error loading details.';
        }
    }

    function setupListeners() {
        // Copy buttons
        document.getElementById('copyAmountBtn').addEventListener('click', () => {
            copyToClipboard(document.getElementById('amountToCopy'));
        });
        
        document.getElementById('copyUpiBtn').addEventListener('click', () => {
            copyToClipboard(document.getElementById('upiToCopy'));
        });

        // UTR Form submission
        document.getElementById('utrForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const utr = document.getElementById('utrNumber').value;
            const submitBtn = document.getElementById('submitUtrBtn');

            if (utr.length < 12 || utr.length > 12) {
                alert('Please enter a valid 12-digit UTR/Ref No.');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'Submitting...';

            try {
                // Create a "pending" request for the admin
                await firebase.firestore().collection('payment_requests').add({
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    amount: parseFloat(rechargeAmount),
                    utr: utr,
                    status: 'pending', // Admin must approve this
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Request submitted! Please wait for admin approval (1-2 hours).');
                localStorage.removeItem('rechargeAmount'); // Clear the amount
                window.location.href = 'mine.html';

            } catch (err) {
                console.error("Error submitting request:", err);
                alert('An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Ref Number';
            }
        });
    }

    function copyToClipboard(inputElement) {
        inputElement.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    }
});
