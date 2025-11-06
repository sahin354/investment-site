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
        rechargeAmount = localStorage.getItem('rechargeAmount');
        paymentEndTime = localStorage.getItem('paymentEndTime');
        localStorage.removeItem('rechargeAmount');
        localStorage.removeItem('paymentEndTime');

        if (!rechargeAmount || !paymentEndTime) {
            if(timerInterval) clearInterval(timerInterval);
            timerElement.textContent = "SESSION EXPIRED";
            alert('This payment session has expired or is invalid. Please try again.');
            document.body.innerHTML = "<h1>Session Expired. Please close this tab and try again.</h1>";
            return;
        }

        startTimer(paymentEndTime);

        const amountNum = parseFloat(rechargeAmount);
        payableAmount.textContent = `₹ ${amountNum.toFixed(2)}`;
        amountField.value = amountNum.toFixed(2);

        loadPaymentDetails();
        setupListeners();
    }

    function startTimer(endTime) {
        timerInterval = setInterval(() => {
            const now = Date.now();
            const remaining = endTime - now;

            if (remaining <= 0) {
                clearInterval(timerInterval);
                timerElement.textContent = "Time Expired";
                alert('Payment session expired. Please try again.');
                window.close(); // Close this tab
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
                
                generateQrCode(upiId, rechargeAmount); 

            } else {
                upiField.value = 'Error: Admin has not set a UPI ID.';
                alert('Error: Payment UPI ID is not set. Please contact support.');
            }
        } catch (err) {
            console.error("Error loading payment details:", err);
            upiField.value = 'Error loading details.';
        }
    }

    function generateQrCode(upiAddress, amount) {
        const payeeName = encodeURIComponent("Adani Corporation");
        const qrLink = `upi://pay?pa=${upiAddress}&pn=${payeeName}&am=${amount}&cu=INR`;
        
        const qrCodeImage = document.getElementById('qrCodeImage');
        const qrCodeLoader = document.getElementById('qrCodeLoader');
        const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrLink)}`;
        
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

        // Payment Failed Link
        document.getElementById('paymentFailedLink').addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to cancel this payment?")) {
                clearInterval(timerInterval);
                alert("Payment cancelled.");
                window.close();
            }
        });

        // --- === UTR Form submission (THIS IS THE UPDATED PART) === ---
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
            clearInterval(timerInterval);

            const db = firebase.firestore();
            const batch = db.batch();

            try {
                // 1. Create the Transaction doc first to get its ID
                const txRef = db.collection('transactions').doc();
                const txId = txRef.id;
                
                batch.set(txRef, {
                    userId: currentUser.uid,
                    type: 'Deposit',
                    amount: parseFloat(rechargeAmount),
                    details: `Deposit Request (UTR: ${utr})`,
                    status: 'Pending', // <-- As requested
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // 2. Create the Admin's Payment Request doc
                const reqRef = db.collection('payment_requests').doc();
                batch.set(reqRef, {
                    userId: currentUser.uid,
                    userEmail: currentUser.email,
                    amount: parseFloat(rechargeAmount),
                    utr: utr,
                    status: 'pending', 
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    transactionId: txId // <-- Link the two documents
                });
    
                // 3. Commit both writes at once
                await batch.commit();

                alert('Request submitted! Your transaction history will show "Pending" until approved (1-2 hours).');
                window.close(); // Close this tab on success

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
            
