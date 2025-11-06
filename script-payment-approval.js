// This file handles the new Payment Approval tab in the admin panel.
document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof firebase === 'undefined') return;
    
    const db = firebase.firestore();
    const functions = firebase.functions();

    // --- 1. Load Deposit Requests ---
    function loadDepositRequests() {
        const tableBody = document.getElementById('paymentRequestsTableBody');
        if (!tableBody) return; 

        db.collection('payment_requests')
          .where('status', '==', 'pending')
          .onSnapshot(snapshot => {
              tableBody.innerHTML = ''; // Clear old data
              if (snapshot.empty) {
                  tableBody.innerHTML = '<tr><td colspan="5">No pending deposit requests.</td></tr>';
                  return;
              }
              
              const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

              requests.forEach(request => {
                  const requestId = request.id;
                  const date = request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleString() : 'N/A';
                  
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                      <td>${date}</td>
                      <td>${request.userEmail}</td>
                      <td>₹${request.amount}</td>
                      <td>${request.utr}</td>
                      <td>
                          <button class="action-btn edit-btn approve-deposit-btn" data-id="${requestId}" data-user="${request.userId}" data-amount="${request.amount}">Approve</button>
                          <button class="action-btn delete-btn reject-deposit-btn" data-id="${requestId}">Reject</button>
                      </td>
                  `;
                  tableBody.appendChild(tr);
              });
          });
    }

    // --- 2. NEW: Load Withdrawal Requests ---
    function loadWithdrawalRequests() {
        const tableBody = document.getElementById('withdrawalRequestsTableBody');
        if (!tableBody) return;

        db.collection('withdrawal_requests')
          .where('status', '==', 'Pending') // Note: 'Pending' (capital P) from script-mine.js
          .onSnapshot(snapshot => {
              tableBody.innerHTML = '';
              if (snapshot.empty) {
                  tableBody.innerHTML = '<tr><td colspan="9">No pending withdrawal requests.</td></tr>';
                  return;
              }
              
              const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

              requests.forEach(req => {
                  const date = req.createdAt ? new Date(req.createdAt.seconds * 1000).toLocaleString() : 'N/A';
                  
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                      <td>${date}</td>
                      <td>${req.userEmail}</td>
                      <td>₹${req.amount.toFixed(2)}</td>
                      <td>₹${req.tds.toFixed(2)}</td>
                      <td><strong>₹${req.finalAmount.toFixed(2)}</strong></td>
                      <td>${req.bankRealName}</td>
                      <td>${req.bankAccount}</td>
                      <td>${req.bankIFSC}</td>
                      <td>
                          <button class="action-btn edit-btn approve-withdraw-btn" data-id="${req.id}" data-txid="${req.transactionId}">Approve</button>
                          <button class="action-btn delete-btn reject-withdraw-btn" data-id="${req.id}" data-txid="${req.transactionId}" data-user="${req.userId}" data-amount="${req.amount}">Reject</button>
                      </td>
                  `;
                  tableBody.appendChild(tr);
              });
          });
    }

    // --- 3. Add Listeners for ALL buttons (Deposits & Withdrawals) ---
    document.body.addEventListener('click', async (e) => {
        // --- Deposit Approve ---
        if (e.target.classList.contains('approve-deposit-btn')) {
            if (!confirm('Are you sure you have received this payment? This will add money to the user account.')) return;
            
            const requestId = e.target.dataset.id;
            const userId = e.target.dataset.user;
            const amount = parseFloat(e.target.dataset.amount);
            
            await approveDepositPayment(requestId, userId, amount);
        }
        
        // --- Deposit Reject ---
        if (e.target.classList.contains('reject-deposit-btn')) {
            if (!confirm('Are you sure you want to reject this payment?')) return;
            const requestId = e.target.dataset.id;
            await rejectDepositPayment(requestId);
        }
        
        // --- NEW: Withdrawal Approve ---
        if (e.target.classList.contains('approve-withdraw-btn')) {
            if (!confirm('Have you sent the money to this user? This will mark the transaction as successful.')) return;
            
            const requestId = e.target.dataset.id;
            const txId = e.target.dataset.txid;
            await approveWithdrawal(requestId, txId);
        }
        
        // --- NEW: Withdrawal Reject ---
        if (e.target.classList.contains('reject-withdraw-btn')) {
            if (!confirm('Are you sure you want to reject this? This will return the funds to the user.')) return;
            
            const requestId = e.target.dataset.id;
            const txId = e.target.dataset.txid;
            const userId = e.target.dataset.user;
            const amount = parseFloat(e.target.dataset.amount); // The original amount to refund
            await rejectWithdrawal(requestId, txId, userId, amount);
        }
    });

    // --- 4. Function to call the secure Cloud Function (for Deposits) ---
    async function approveDepositPayment(requestId, userId, amount) {
        try {
            // Note: This cloud function 'approveManualPayment' should already exist from your setup
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

    // --- 5. Function to Reject the deposit payment ---
    async function rejectDepositPayment(requestId) {
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
    
    // --- 6. NEW: Function to Approve a Withdrawal ---
    async function approveWithdrawal(requestId, txId) {
        const batch = db.batch();
        
        const reqRef = db.collection('withdrawal_requests').doc(requestId);
        batch.update(reqRef, { status: 'Success' });
        
        const txRef = db.collection('transactions').doc(txId);
        batch.update(txRef, { status: 'Success', details: 'Withdrawal Successful' });
        
        try {
            await batch.commit();
            alert('Withdrawal approved!');
        } catch (err) {
            console.error('Error approving withdrawal:', err);
            alert('Error: ' + err.message);
        }
    }

    // --- 7. NEW: Function to Reject a Withdrawal (and refund user) ---
    async function rejectWithdrawal(requestId, txId, userId, amount) {
        const batch = db.batch();
        
        // 1. Mark request as rejected
        const reqRef = db.collection('withdrawal_requests').doc(requestId);
        batch.update(reqRef, { status: 'Rejected' });
        
        // 2. Mark transaction as rejected
        const txRef = db.collection('transactions').doc(txId);
        batch.update(txRef, { status: 'Rejected', details: 'Withdrawal Rejected' });
        
        // 3. Refund the user
        const userRef = db.collection('users').doc(userId);
        batch.update(userRef, {
            balance: firebase.firestore.FieldValue.increment(amount) // 'amount' is positive
        });
        
        try {
            await batch.commit();
            alert('Withdrawal rejected and funds returned to user.');
        } catch (err) {
            console.error('Error rejecting withdrawal:', err);
            alert('Error: ' + err.message);
        }
    }


    // --- 8. Load data when the "Payments" tab is clicked & Sub-tab logic ---
    document.addEventListener('click', e => {
        // Main Tab
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'payments') {
            loadDepositRequests();
            loadWithdrawalRequests();
        }
        
        // Sub Tabs
        if (e.target.classList.contains('payment-sub-tab')) {
            const tabName = e.target.dataset.tab; // 'deposits' or 'withdrawals'
            
            // Update button styles
            document.querySelectorAll('.payment-sub-tab').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            
            // Show/Hide content
            document.querySelectorAll('.payment-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Content').classList.add('active');
        }
    });
    
    // Initial load if tab is already active
    if (document.getElementById('paymentsTab') && document.getElementById('paymentsTab').classList.contains('active')) {
        loadDepositRequests();
        loadWithdrawalRequests();
    }
    
    // --- 9. Config loading (unchanged) ---
    const saveSettingsButton = document.getElementById('saveSettingsButton');
    if (saveSettingsButton) {
        saveSettingsButton.addEventListener('click', async () => {
            const paymentConfig = {
              upiId: document.getElementById('paymentUpiId').value,
              accountInfo: document.getElementById('paymentAccountInfo').value
            };
            
            try {
                await db.collection('system_config').doc('payment_details').set(paymentConfig, { merge: true });
            } catch (err) {
                 alert('Error saving payment details: ' + err.message);
            }
        });
    }
    
    async function loadPaymentConfig() {
        if(!document.getElementById('paymentUpiId')) return;
        
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
    
    // Initial load for config
    loadPaymentConfig();
});
        
