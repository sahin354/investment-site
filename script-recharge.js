document.addEventListener('DOMContentLoaded', function () {
  // Check authentication
  firebase.auth().onAuthStateChanged(function (user) {
    if (!user) {
      console.log('User not authenticated, redirecting to login');
      window.location.href = 'login.html';
      return;
    }
    initializeRechargePage(user);
  });

  function initializeRechargePage(user) {
    loadCurrentBalance(user.uid);
    setupRechargeListeners(user);
  }

  function loadCurrentBalance(userId) {
    const userDoc = firebase.firestore().collection('users').doc(userId);

    // Listen for real-time updates to the balance
    userDoc.onSnapshot(
      (doc) => {
        if (doc.exists) {
          const userData = doc.data();
          const balanceElement = document.getElementById('currentBalance');
          if (balanceElement && userData.balance !== undefined) {
            balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
          }
        }
      },
      (error) => {
        console.error('Error loading balance:', error);
      }
    );
  }

  function setupRechargeListeners(user) {
    // Quick amount buttons
    const quickAmountBtns = document.querySelectorAll('.quick-amount-btn');
    quickAmountBtns.forEach((btn) => {
      btn.addEventListener('click', function () {
        const amount = this.getAttribute('data-amount');
        document.getElementById('rechargeAmount').value = amount;
        quickAmountBtns.forEach((b) => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // Proceed to recharge button
    const proceedBtn = document.getElementById('proceedRecharge');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', function (e) {
        e.preventDefault();
        const amount = parseFloat(
          document.getElementById('rechargeAmount').value
        );

        if (!amount || amount <= 0 || amount < 100) {
          alert('Please enter a valid amount (minimum ₹100)');
          return;
        }

        // Disable button to prevent multiple clicks
        proceedBtn.textContent = 'Processing...';
        proceedBtn.disabled = true;

        // Call the new, secure recharge function
        processRecharge(user, amount);
      });
    }
  }

  /**
   * Secure recharge process
   */
  async function processRecharge(user, amount) {
    const proceedBtn = document.getElementById('proceedRecharge');

    try {
      // 1. Call the Cloud Function to create an order
      const createOrder = firebase.functions().httpsCallable('createRazorpayOrder');
      const result = await createOrder({ amount: amount });
      const orderId = result.data.orderId;

      if (!orderId) {
        throw new Error('Failed to create order ID.');
      }

      // 2. Open the Razorpay Checkout
      const options = {
        key: 'YOUR_PUBLIC_KEY_ID', // !! IMPORTANT: REPLACE THIS !!
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Adani Corporation', // Your site name
        description: 'Add Money to Wallet',
        order_id: orderId,
        handler: async function (response) {
          // 3. Payment was successful, now VERIFY it on the backend
          proceedBtn.textContent = 'Verifying...';
          
          const verifyPayment = firebase.functions().httpsCallable('verifyRazorpayPayment');
          
          await verifyPayment({
            order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            amount: amount, // Pass the original amount for verification
          });

          // 4. Verification successful!
          alert(`Successfully recharged ₹${amount}!`);
          document.getElementById('rechargeAmount').value = '0';
          proceedBtn.textContent = 'Proceed to Recharge';
          proceedBtn.disabled = false;
        },
        prefill: {
          name: user.displayName || '',
          email: user.email,
        },
        modal: {
          ondismiss: function() {
            // Re-enable button if user closes the modal
            proceedBtn.textContent = 'Proceed to Recharge';
            proceedBtn.disabled = false;
          }
        }
      };

      const rzp = new Razorpay(options);

      // Handle payment failures
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}`);
        proceedBtn.textContent = 'Proceed to Recharge';
        proceedBtn.disabled = false;
      });

      rzp.open(); // Open the payment modal
    
    } catch (error) {
      console.error('Recharge error:', error);
      alert(`Recharge failed: ${error.message}`);
      proceedBtn.textContent = 'Proceed to Recharge';
      proceedBtn.disabled = false;
    }
  }
});
