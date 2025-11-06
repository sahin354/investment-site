// Mine Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser;
    let currentUserData = null; // Store user data for balance checks

    // Check authentication
    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        currentUser = user;
        initializeMinePage(user);
    });

    function initializeMinePage(user) {
        updateProfileInfo(user);
        setupEventListeners(user);
        setupRealTimeBalance(user.uid);
    }

    function updateProfileInfo(user) {
        const profileId = document.getElementById('profileId');
        const profileEmail = document.getElementById('profileEmail');
        
        if (profileId) {
            profileId.textContent = `ID: ${user.uid.substring(0, 10)}...`;
        }
        if (profileEmail) {
            profileEmail.textContent = user.email || 'No email available';
        }
    }

    function setupRealTimeBalance(userId) {
        const userDoc = firebase.firestore().collection('users').doc(userId);
        
        userDoc.onSnapshot((doc) => {
            if (doc.exists) {
                currentUserData = doc.data(); // <-- IMPORTANT: Store user data
                const balanceElement = document.getElementById('profileBalance');
                
                if (balanceElement && currentUserData.balance !== undefined) {
                    balanceElement.textContent = `₹${currentUserData.balance.toFixed(2)}`;
                }
            }
        }, (error) => {
            console.error('Real-time balance update error:', error);
        });
    }

    function setupEventListeners(user) {
        // --- Transaction Modal Elements ---
        const txModalContainer = document.getElementById('txModalContainer');
        const txModalOverlay = document.getElementById('txModalOverlay');

        // --- Bank Modal Elements ---
        const bankModalContainer = document.getElementById('bankModalContainer');
        const bankModalOverlay = document.getElementById('bankModalOverlay');
        const bankDetailsForm = document.getElementById('bankDetailsForm');
        
        // --- NEW: Withdrawal Modal Elements ---
        const withdrawModalContainer = document.getElementById('withdrawModalContainer');
        const withdrawModalOverlay = document.getElementById('withdrawModalOverlay');
        const withdrawModalCloseBtn = document.getElementById('withdrawModalCloseBtn');
        const withdrawForm = document.getElementById('withdrawForm');
        const withdrawAmountInput = document.getElementById('withdrawAmount');

        // Function to open the Transaction modal
        const openTxModal = () => {
            txModalContainer.style.display = 'flex'; 
            txModalOverlay.style.display = 'block';
            document.body.classList.add('modal-open');
            loadTransactionHistory(user.uid); 
        };

        // Function to close the Transaction modal
        const closeTxModal = () => {
            txModalContainer.style.display = 'none';
            txModalOverlay.style.display = 'none';
            document.body.classList.remove('modal-open');
        };

        // --- Functions to open/close Bank modal ---
        const openBankModal = () => {
            bankModalContainer.style.display = 'flex'; 
            bankModalOverlay.style.display = 'block';
            document.body.classList.add('modal-open');
            loadBankDetails(user.uid); // Load existing data
        };

        const closeBankModal = () => {
            bankModalContainer.style.display = 'none';
            bankModalOverlay.style.display = 'none';
            document.body.classList.remove('modal-open');
        };

        // --- NEW: Functions to open/close Withdrawal modal ---
        const openWithdrawModal = () => {
            // CRITICAL: Check for bank details first
            if (!currentUserData || !currentUserData.bankRealName || currentUserData.bankRealName.length === 0) {
                alert('Please add your Bank Account Details first before withdrawing.');
                openBankModal(); // Guide user to the bank modal
                return;
            }
            
            // Populate current balance
            const balanceEl = document.getElementById('withdrawBalance');
            if (balanceEl && currentUserData && currentUserData.balance !== undefined) {
                balanceEl.textContent = `₹${currentUserData.balance.toFixed(2)}`;
            }
            
            withdrawModalContainer.style.display = 'flex'; 
            withdrawModalOverlay.style.display = 'block';
            document.body.classList.add('modal-open');
        };

        const closeWithdrawModal = () => {
            withdrawModalContainer.style.display = 'none';
            withdrawModalOverlay.style.display = 'none';
            document.body.classList.remove('modal-open');
            withdrawForm.reset(); // Clear the form
        };


        // --- Page Buttons ---
        document.getElementById('rechargeBtn').addEventListener('click', () => {
            window.location.href = 'recharge.html';
        });
        
        // --- MODIFIED: Withdraw Button ---
        document.getElementById('withdrawBtn').addEventListener('click', () => {
            openWithdrawModal();
        });
        
        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'login.html';
            });
        });

        // --- Option Buttons ---
        document.getElementById('bankDetailsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openBankModal();
        });
         document.getElementById('changePasswordBtn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('This feature is coming soon!');
        });
        document.getElementById('transactionHistoryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openTxModal();
        });

        // --- Modal Close Buttons ---
        document.getElementById('txModalCloseBtn').addEventListener('click', closeTxModal);
        txModalOverlay.addEventListener('click', closeTxModal);
        document.getElementById('bankModalCloseBtn').addEventListener('click', closeBankModal);
        bankModalOverlay.addEventListener('click', closeBankModal);
        
        // --- NEW: Withdrawal Modal Close ---
        withdrawModalCloseBtn.addEventListener('click', closeWithdrawModal);
        withdrawModalOverlay.addEventListener('click', closeWithdrawModal);


        // --- Handle Bank Details Form Submit ---
        bankDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBankDetails(user.uid);
        });
        
        // --- NEW: Handle Withdraw Form Calculation ---
        withdrawAmountInput.addEventListener('input', () => {
            const amount = parseFloat(withdrawAmountInput.value) || 0;
            const tds = amount * 0.18;
            const receive = amount - tds;
            
            document.getElementById('withdrawTDS').textContent = `₹${tds.toFixed(2)}`;
            document.getElementById('withdrawReceive').textContent = `₹${receive.toFixed(2)}`;
        });
        
        // --- NEW: Handle Withdraw Form Submit ---
        withdrawForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleWithdrawal(user.uid);
        });
    }
    
    // --- Bank Form lock/unlock (unchanged) ---
    function lockBankForm() {
        document.getElementById('bankRealName').disabled = true;
        document.getElementById('bankAccount').disabled = true;
        document.getElementById('bankConfirmAccount').disabled = true;
        document.getElementById('bankIFSC').disabled = true;
        document.getElementById('bankUPI').disabled = true;
        document.getElementById('saveBankBtn').style.display = 'none';
        document.getElementById('bankDetailsLockedInfo').style.display = 'block';
    }
    function unlockBankForm() {
        document.getElementById('bankRealName').disabled = false;
        document.getElementById('bankAccount').disabled = false;
        document.getElementById('bankConfirmAccount').disabled = false;
        document.getElementById('bankIFSC').disabled = false;
        document.getElementById('bankUPI').disabled = false;
        document.getElementById('saveBankBtn').style.display = 'block';
        document.getElementById('bankDetailsLockedInfo').style.display = 'none';
    }

    // --- loadBankDetails (unchanged) ---
    function loadBankDetails(userId) {
        firebase.firestore().collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                const hasBankDetails = userData.bankRealName && userData.bankRealName.length > 0;
                document.getElementById('bankRealName').value = userData.bankRealName || '';
                document.getElementById('bankAccount').value = userData.bankAccount || '';
                document.getElementById('bankConfirmAccount').value = userData.bankAccount || '';
                document.getElementById('bankIFSC').value = userData.bankIFSC || '';
                document.getElementById('bankUPI').value = userData.bankUPI || '';
                if (hasBankDetails) lockBankForm();
                else unlockBankForm();
            } else {
                unlockBankForm();
            }
        });
    }

    // --- saveBankDetails (unchanged) ---
    async function saveBankDetails(userId) {
        const saveBtn = document.getElementById('saveBankBtn');
        const form = document.getElementById('bankDetailsForm');
        
        if (!form.checkValidity()) {
            alert('Please fill all fields correctly.');
            return;
        }
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const name = document.getElementById('bankRealName').value;
        const account = document.getElementById('bankAccount').value;
        const confirmAccount = document.getElementById('bankConfirmAccount').value;
        const ifsc = document.getElementById('bankIFSC').value.toUpperCase();
        const upi = document.getElementById('bankUPI').value;

        if (account !== confirmAccount) {
            alert('Bank account numbers do not match. Please check.');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Details';
            return;
        }
        try {
            await firebase.firestore().collection('users').doc(userId).update({
                bankRealName: name,
                bankAccount: account,
                bankIFSC: ifsc,
                bankUPI: upi
            });
            alert('Bank details saved successfully!');
            lockBankForm();
            document.getElementById('bankModalCloseBtn').click();
        } catch (error) {
            console.error("Error saving bank details: ", error);
            alert('Failed to save details. Please try again.');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Details';
        }
    }
    
    // --- NEW: Withdrawal Submit Logic ---
    async function handleWithdrawal(userId) {
        const submitBtn = document.getElementById('submitWithdrawBtn');
        const amount = parseFloat(document.getElementById('withdrawAmount').value);
        const currentBalance = currentUserData.balance;

        // --- 1. Validation ---
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }
        if (amount < 130) {
            alert('Minimum withdrawal amount is ₹130.');
            return;
        }
        if (amount > currentBalance) {
            alert('Insufficient balance. You cannot withdraw more than you have.');
            return;
        }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        const db = firebase.firestore();
        const batch = db.batch();
        const userRef = db.collection('users').doc(userId);
        
        // --- 2. Create Transaction Doc First ---
        const txRef = db.collection('transactions').doc();
        const txId = txRef.id; // Get the auto-generated ID
        
        const tdsAmount = amount * 0.18;
        const finalAmount = amount - tdsAmount;
        
        batch.set(txRef, {
            userId: userId,
            type: 'Withdrawal',
            amount: -amount, // Store as negative
            details: 'Withdrawal Request',
            status: 'Pending', // <-- NEW STATUS FIELD
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });

        // --- 3. Create Admin Withdrawal Request Doc ---
        const withdrawReqRef = db.collection('withdrawal_requests').doc();
        batch.set(withdrawReqRef, {
            userId: userId,
            userEmail: currentUser.email,
            amount: amount,
            tds: tdsAmount,
            finalAmount: finalAmount, // Amount admin needs to send
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            transactionId: txId, // <-- Link to the transaction
            // Copy bank details for admin convenience
            bankRealName: currentUserData.bankRealName,
            bankAccount: currentUserData.bankAccount,
            bankIFSC: currentUserData.bankIFSC
        });

        // --- 4. Deduct Balance from User ---
        batch.update(userRef, {
            balance: firebase.firestore.FieldValue.increment(-amount)
        });

        // --- 5. Commit Batch ---
        try {
            await batch.commit();
            alert('Withdrawal request submitted! It will be processed by our team.');
            document.getElementById('withdrawModalCloseBtn').click();
        } catch (error) {
            console.error("Error submitting withdrawal: ", error);
            alert('An error occurred: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    }

    // --- Transaction Icon (unchanged) ---
    function getTransactionIcon(type) {
        const cleanType = type.toLowerCase();
        if (cleanType.includes('invest')) return '💼'; 
        if (cleanType.includes('earning')) return '📈'; 
        if (cleanType.includes('deposit')) return '📥'; 
        if (cleanType.includes('withdrawal')) return '📤';
        if (cleanType.includes('adjust')) return '🔧'; 
        return '📄'; 
    }

    // --- UPDATED: loadTransactionHistory Function ---
    function loadTransactionHistory(userId) {
        const listContainer = document.getElementById('txModalContent');
        listContainer.innerHTML = '<p>Loading transactions...</p>';
        const db = firebase.firestore();
        
        const txQuery = db.collection('transactions')
                          .where('userId', '==', userId);
                          
        txQuery.onSnapshot((snapshot) => {
            if (snapshot.empty) {
                listContainer.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            listContainer.innerHTML = ''; 

            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            docs.sort((a, b) => {
                const dateA = a.timestamp ? a.timestamp.seconds : 0;
                const dateB = b.timestamp ? b.timestamp.seconds : 0;
                return dateB - dateA; 
            });

            docs.forEach((tx) => {
                const amount = tx.amount;
                const date = tx.timestamp ? tx.timestamp.toDate().toLocaleDateString() : 'Just now';
                const time = tx.timestamp ? tx.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                
                // --- NEW: Add status logic ---
                const status = tx.status || (tx.type === 'Withdrawal' ? 'Success' : ''); // Default old withdrawals to 'Success'
                const statusClass = status.toLowerCase();
                const statusHTML = status ? `<span class="transaction-status status-${statusClass}">${status}</span>` : '';

                const txHTML = `
                    <div class="transaction-item modern">
                        <div class="transaction-icon">
                            ${getTransactionIcon(tx.type)}
                        </div>
                        <div class="transaction-details">
                            <span class="transaction-type">${tx.type}</span>
                            <span class="transaction-info">${tx.details}</span>
                        </div>
                        <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                            ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                            <span class="transaction-date">${date} ${time}</span>
                            ${statusHTML}
                        </div>
                    </div>
                `;
                listContainer.innerHTML += txHTML;
            });
            
        }, (error) => {
            console.error("Error loading transactions:", error);
            listContainer.innerHTML = '<p style="color:red;">Error loading history.</p>';
        });
    }
});
    
