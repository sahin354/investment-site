// This file handles the new Payment Approval tab in the admin panel.
document.addEventListener('DOMContentLoaded', () => {
    
    // Make sure to initialize db and functions if not already global
    // But since script-control.js is loaded first, they should be available.
    if (typeof firebase === 'undefined') return;
    
    const db = firebase.firestore();
    const functions = firebase.functions();

    // --- 1. Load Payment Requests ---
    function loadPaymentRequests() {
        const tableBody = document.getElementById('paymentRequestsTableBody');
        if (!tableBody) return; // Exit if the table isn't on this page

        db.collection('payment_requests')
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'desc')
          .onSnapshot(snapshot => {
              tableBody.innerHTML = ''; // Clear old data
              if (snapshot.empty) {
                  tableBody.innerHTML = '<tr><td colspan="5">No pending requests.</td></tr>';
                  return;
              }
              
              snapshot.forEach(doc => {
                  const request = doc.data();
                  const requestId = doc.id;
                  
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                      <td>${new Date(request.createdAt.seconds * 1000).toLocaleString()}</td>
                      <td>${request.userEmail}</td>
                      <td>₹${request.amount}</td>
                      <td>${request.utr}</td>
                      <td>
                          <button class="action-btn edit-btn approve-btn" data-id="${requestId}" data-user="${request.userId}" data-amount="${request.amount}">Approve</button>
                          <button class="action-btn delete-btn reject-btn" data-id="${requestId}">Reject</button>
                      </td>
                  `;
                  tableBody.appendChild(tr);
              });
          });
    }

    // --- 2. Add Listeners for Approve/Reject buttons ---
    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('approve-btn')) {
            if (!confirm('Are you sure you have received this payment? This will add money to the user account.')) return;
            
            const requestId = e.target.dataset.id;
            const userId = e.target.dataset.user;
            const amount = parseFloat(e.target.dataset.amount);
            
            approvePayment(requestId, userId, amount);
        }
        
        if (e.target.classList.contains('reject-btn')) {
            if (!confirm('Are you sure you want to reject this payment?')) return;
            
            const requestId = e.target.dataset.id;
            rejectPayment(requestId);
        }
    });

    // --- 3. Function to call the secure Cloud Function ---
    async function approvePayment(requestId, userId, amount) {
        try {
            const approveFunction = functions.httpsCallable('approveManualPayment');
            
            await approveFunction({
                requestId: requestId,
                userId: userId,
                amount: amount
            });
            
            alert('Payment approved and balance updated!');
        } catch (err) {
            console.error("Error approving payment:", err);
            alert('Error: ' + err.message);
        }
    }

    // --- 4. Function to Reject the payment ---
    async function rejectPayment(requestId) {
        try {
            await db.collection('payment_requests').doc(requestId).update({
                status: 'rejected'
            });
            alert('Payment rejected.');
        } catch (err) {
            console.error("Error rejecting payment:", err);
            alert('Error: ' + err.message);
        }
    }

    // --- 5. Load data when the "Payments" tab is clicked ---
    // This connects to your existing tab logic in script-control.js
    document.addEventListener('click', e => {
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'payments') {
            loadPaymentRequests();
        }
    });
    
    // Also load it once when the page loads, in case it's the default tab
    // We check if the tab exists first
    if (document.getElementById('paymentsTab')) {
        loadPaymentRequests();
    }
    
    // --- 6. Add logic for the new fields in "System Config" tab ---
    // Find the save button from script-control.js
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    if (saveSettingsButton) {
        // We add this *inside* the existing click listener from script-control.js
        // A bit of a hack, but safer than replacing the whole file
        saveSettingsButton.addEventListener('click', async () => {
            const paymentConfig = {
              upiId: document.getElementById('paymentUpiId').value,
              accountInfo: document.getElementById('paymentAccountInfo').value
            };
            
            try {
                // Save the payment config to a separate document
                await db.collection('system_config').doc('payment_details').set(paymentConfig);
                // The main settings are saved by script-control.js
                // We just add this save on top.
            } catch (err) {
                 alert('Error saving payment details: ' + err.message);
            }
        });
    }
    
    // Load the payment settings
    async function loadPaymentConfig() {
        const paymentDoc = await db.collection('system_config').doc('payment_details').get();
        if (paymentDoc.exists) {
            const data = paymentDoc.data();
            const upiField = document.getElementById('paymentUpiId');
            const bankField = document.getElementById('paymentAccountInfo');
            
            if (upiField) upiField.value = data.upiId || '';
            if (bankField) bankField.value = data.accountInfo || '';
        }
    }
    
    // Load when the settings tab is clicked
    document.addEventListener('click', e => {
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'settings') {
            loadPaymentConfig();
        }
    });
    
    // Also load on page start
    loadPaymentConfig();
});
