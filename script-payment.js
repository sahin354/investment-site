document.addEventListener('DOMContentLoaded', function() {
    let currentUser;
    let rechargeAmount;
    let paymentEndTime;
    let upiId;
    let timerInterval;

    const timerElement = document.getElementById('countdownTimer');
    const upiField = document.getElementById('upiToCopy');
    const amountField = document.getElementById('amountToCopy');
    const payableAmount = document.getElementById('payableAmount');

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            currentUser = user;
            loadPaymentPage();
        }
    });

    function loadPaymentPage() {
        // --- THIS IS THE "REFRESH FIX" ---
        // 1. Get amount and timer from localStorage
        rechargeAmount = localStorage.getItem('rechargeAmount');
        paymentEndTime = localStorage.getItem('paymentEndTime');
        
        // 2. IMMEDIATELY delete them.
        // This makes the page a one-time link.
        localStorage.removeItem('rechargeAmount');
        localStorage.removeItem('paymentEndTime');
        // --- END OF "REFRESH FIX" ---

        // 3. Check if the data was missing (e.g., user refreshed)
        if (!rechargeAmount || !paymentEndTime) {
            if(timerInterval) clearInterval(timerInterval);
            timerElement.textContent = "SESSION EXPIRED";
            alert('This payment session has expired or is invalid. Please try again.');
            document.body.innerHTML = "<h1>Session Expired. Please close this tab and try again.</h1>";
            return;
        }

        // 4. Start the countdown timer
        startTimer(paymentEndTime);

        // 5. Set amount fields
        const amountNum = parseFloat(rechargeAmount);
        payableAmount.textContent = `₹ ${amountNum.toFixed(2)}`;
        amountField.value = amountNum.toFixed(2);

        // 6. Load UPI details and create links
        loadPaymentDetails();

        // 7. Add listeners
        setupListeners();
    }

    // --- Countdown Timer ---
    function startTimer(endTime) {
        timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;

            if (remaining <= 0) {
                clearInterval(timerInterval);
                timerElement.textContent = "Time Expired";
                alert('Payment session expired. Please try again.');
                window.location.href = 'recharge.html';
                return;
            }

            const minutes = Math.floor((remaining / 1000) / 60);
            const seconds = Math.floor((remaining / 1000) % 60);
            
            timerElement.textContent = `Time left: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        }, 1000);
    }

    async function loadPaymentDetails() {
        try {
            const doc = await firebase.firestore().collection('system_config').doc('payment_details').get();
            if (doc.exists && doc.data().upiId) {
                upiId = doc.data().upiId;
                upiField.value = upiId;
                
                // Create UPI Deep Link
                createUpiLinks(upiId, rechargeAmount, currentUser.email);

            } else {
                upiField.value = 'Error: Admin has not set a UPI ID.';
                alert('Error: Payment UPI ID is not set. Please contact support.');
            }
        } catch (err) {
            console.error("Error loading payment details:", err);
            upiField.value = 'Error loading details.';
        }
    }

    // --- Create UPI Deep Links ---
    function createUpiLinks(upiAddress, amount, userEmail) {
        
        // --- IMPORTANT WARNING ---
        // This will ONLY work on a MOBILE PHONE with the apps installed.
        // It will NOT work on a desktop computer.
        
        const note = encodeURIComponent(`Recharge for ${userEmail}`);
        const payeeName = encodeURIComponent("Adani Corporation"); // Your company name
        
        const upiLink = `upi://pay?pa=${upiAddress}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}`;

        document.getElementById('paytmLink').href = upiLink;
        document.getElementById('phonepeLink').href = upiLink;
        document.getElementById('gpayLink').href = upiLink;

        // --- Generate QR Code ---
        const qrCodeImage = document.getElementById('qrCodeImage');
        const qrCodeLoader = document.getElementById('qrCodeLoader');
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}`;
        
        qrCodeImage.src = qrApi;
        qrCodeImage.onload = () => {
            qrCodeLoader.style.display = 'none'; 
            qrCodeImage.style.display = 'block';
        }
    }

    function setupListeners() {
        // Copy buttons
        document.getElementById('copyAmountBtn').addEventListener('click', () => {
            copyToClipboard(amountField);
        });
        
        document.getElementById('copyUpiBtn').addEventListener('click', () => {
            copyToClipboard(upiField);
        });

        // Toggle QR Code
        document.getElementById('scanQrToggle').addEventListener('click', () => {
            const qrContainer = document.getElementById('qrCodeContainer');
            qrContainer.style.display = qrContainer.style.display === 'none' ? 'block' : 'none';
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
            clearInterval(timerInterval); // Stop the timer

            try {
                // Create a "pending" request for the admin
                await firebase.firestore().collection('payment_requests').add({
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    amount: parseFloat(rechargeAmount),
                    utr: utr,
                    status: 'pending', 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert('Request submitted! Please wait for admin approval (1-2 hours).');
                // We don't need to clear localStorage, it's already done.
                window.location.href = 'mine.html';

            } catch (err) {
                console.error("Error submitting request:", err);
                alert('An error occurred. Please try again.');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Ref Number';
                // Don't restart timer, session is already expired
            }
        });
    }

    function copyToClipboard(inputElement) {
        inputElement.select();
        document.execCommand('copy');
        alert('Copied to clipboard!');
    }
});
