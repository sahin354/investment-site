// This is your NEW, FULL script-payment-approval.js file.
// It calls your secure Node.js functions.

document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof firebase === 'undefined') return;
    
    const db = firebase.firestore();

    // --- 1. Load Deposit Requests ---
    function loadDepositRequests() {
        const tableBody = document.getElementById('paymentRequestsTableBody');
        if (!tableBody) return; 

        db.collection('payment_requests')
          .where('status', '==', 'pending')
          .onSnapshot(snapshot => {
              tableBody.innerHTML = '';
              if (snapshot.empty) {
                  tableBody.innerHTML = '<tr><td colspan="5">No pending deposit requests.</td></tr>';
                  return;
              }
              
              const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              requests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

              requests.forEach(request => {
                  const requestId = request.id;
                  const date = request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleString() : 'N/A';
                  const txId = request.transactionId || ''; 
                  
                  const tr = document.createElement('tr');
                  tr.innerHTML = `
                      <td>${date}</td>
                      <td>${request.userEmail}</td>
                      <td>₹${request.amount}</td>
                      <td>${request.utr}</td>
                      <td>
                          <button class="action-btn edit-btn approve-deposit-btn" 
                                  data-id="${requestId}" 
                                  data-user="${request.userId}" 
                                  data-amount="${request.amount}" 
                                  data-txid="${txId}">
                              Approve
                          </button>
                          <button class="action-btn delete-btn reject-deposit-btn" data-id="${requestId}" data-txid="${txId}">Reject</button>
                      </td>
                  `;
                  tableBody.appendChild(tr);
              });
          });
    }

    // --- 2. Load Withdrawal Requests ---
    function loadWithdrawalRequests() {
        const tableBody = document.getElementById('withdrawalRequestsTableBody');
        if (!tableBody) return;

        db.collection('withdrawal_requests')
          .where('status', '==', 'Pending')
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

    // --- 3. Add Listeners for ALL buttons ---
    document.body.addEventListener('click', async (e) => {
        
        // --- Deposit Approve ---
        if (e.target.classList.contains('approve-deposit-btn')) {
            if (!confirm('Are you sure you have received this payment?')) return;
            
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = '...';
            
            const approveDepositFunction = firebase.functions().httpsCallable('approveDeposit');
            try {
                const result = await approveDepositFunction({
                    requestId: btn.dataset.id,
                    userId: btn.dataset.user,
                    amount: parseFloat(btn.dataset.amount),
                    txId: btn.dataset.txid
                });
                alert(result.data.message);
            } catch (err) {
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Approve';
            }
        }
        
        // --- Deposit Reject ---
        if (e.target.classList.contains('reject-deposit-btn')) {
            if (!confirm('Are you sure you want to reject this payment?')) return;
            
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = '...';
            
            const rejectDepositFunction = firebase.functions().httpsCallable('rejectDeposit');
            try {
                const result = await rejectDepositFunction({
                    requestId: btn.dataset.id,
                    txId: btn.dataset.txid
                });
                alert(result.data.message);
            } catch (err) {
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Reject';
            }
        }
        
        // --- Withdrawal Approve ---
        if (e.target.classList.contains('approve-withdraw-btn')) {
            if (!confirm('Have you sent the money to this user?')) return;
            
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = '...';

            const approveWithdrawalFunction = firebase.functions().httpsCallable('approveWithdrawal');
            try {
                const result = await approveWithdrawalFunction({
                    requestId: btn.dataset.id,
                    txId: btn.dataset.txid
                });
                alert(result.data.message);
            } catch (err) {
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Approve';
            }
        }
        
        // --- Withdrawal Reject ---
        if (e.target.classList.contains('reject-withdraw-btn')) {
            if (!confirm('Are you sure you want to reject this? This will return the funds to the user.')) return;
            
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = '...';

            const rejectWithdrawalFunction = firebase.functions().httpsCallable('rejectWithdrawal');
            try {
                const result = await rejectWithdrawalFunction({
                    requestId: btn.dataset.id,
                    txId: btn.dataset.txid,
                    userId: btn.dataset.user,
                    amount: parseFloat(btn.dataset.amount)
                });
                alert(result.data.message);
            } catch (err) {
                alert('Error: ' + err.message);
                btn.disabled = false;
                btn.textContent = 'Reject';
            }
        }
    });

    // --- 4. Tab/Sub-tab logic (Unchanged) ---
    document.addEventListener('click', e => {
        if (e.target.classList.contains('control-tab') && e.target.dataset.tab === 'payments') {
            loadDepositRequests();
            loadWithdrawalRequests();
        }
        if (e.target.classList.contains('payment-sub-tab')) {
            const tabName = e.target.dataset.tab;
            document.querySelectorAll('.payment-sub-tab').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            document.querySelectorAll('.payment-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Content').classList.add('active');
        }
    });
    
    if (document.getElementById('paymentsTab') && document.getElementById('paymentsTab').classList.contains('active')) {
        loadDepositRequests();
        loadWithdrawalRequests();
    }
    
    // --- 5. Config loading (Unchanged) ---
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
    
    loadPaymentConfig();
});
