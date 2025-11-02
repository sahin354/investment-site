// This file handles the new Payment Approval tab in the admin panel.
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof firebase === 'undefined') return;
    
    const db = firebase.firestore();
    const functions = firebase.functions();

    // --- 1. Load Payment Requests ---
    function loadPaymentRequests() {
        const tableBody = document.getElementById('paymentRequestsTableBody');
        if (!tableBody) return; // Exit if the table isn't on this page

        // --- THIS IS THE FIX ---
        // Removed the ".orderBy('createdAt', 'desc')"
        // That query requires a special index, but this simple query does not.
        // Your UTR requests will appear now.
        db.collection('payment_requests')
          .where('status', '==', 'pending')
          .onSnapshot(snapshot => {
              tableBody.innerHTML = ''; // Clear old data
              if (snapshot.empty) {
                  tableBody.innerHTML = '<tr><td colspan="5">No pending requests.</td></tr>';
                  return;
              }
              
              // Sort by date manually
              const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              requests.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds);

              requests.forEach(request => {
                  const requestId = request.id;
                  
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
    document.addEventListener('click', e => {
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'payments') {
            loadPaymentRequests();
        }
    });
    
    if (document.getElementById('paymentsTab')) {
        loadPaymentRequests();
    }
    
    // --- 6. Add logic for the new fields in "System Config" tab ---
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', async () => {
            const paymentConfig = {
              upiId: document.getElementById('paymentUpiId').value,
              accountInfo: document.getElementById('paymentAccountInfo').value
            };
            
            try {
                await db.collection('system_config').doc('payment_details').set(paymentConfig);
            } catch (err) {
                 alert('Error saving payment details: ' + err.message);
            }
        });
    }
    
    async function loadPaymentConfig() {
        if(!document.getElementById('paymentUpiId')) return; // Don't run if not on settings tab
        
        const paymentDoc = await db.collection('system_config').doc('payment_details').get();
        if (paymentDoc.exists) {
            const data = paymentDoc.data();
            const upiField = document.getElementById('paymentUpiId');
            const bankField = document.getElementById('paymentAccountInfo');
            
            if (upiField) upiField.value = data.upiId || '';
            if (bankField) bankField.value = data.accountInfo || '';
        }
    }
    
    document.addEventListener('click', e => {
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'settings') {
            loadPaymentConfig();
        }
    });
    
    loadPaymentConfig();
});
                
