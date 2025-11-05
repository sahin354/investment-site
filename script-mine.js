// Mine Page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    let currentUser;

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
                const userData = doc.data();
                const balanceElement = document.getElementById('profileBalance');
                
                if (balanceElement && userData.balance !== undefined) {
                    balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
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

        // --- Page Buttons ---
        document.getElementById('rechargeBtn').addEventListener('click', () => {
            window.location.href = 'recharge.html';
        });
        document.getElementById('withdrawBtn').addEventListener('click', () => {
            alert('Withdraw functionality will be available soon!');
        });
        document.getElementById('logoutBtn').addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = 'login.html';
            });
        });

        // --- Option Buttons ---
        document.getElementById('bankDetailsBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openBankModal(); // Open bank modal
        });
         document.getElementById('changePasswordBtn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('This feature is coming soon!');
        });
        document.getElementById('transactionHistoryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openTxModal(); // Open transaction modal
        });

        // --- Modal Close Buttons ---
        document.getElementById('txModalCloseBtn').addEventListener('click', closeTxModal);
        txModalOverlay.addEventListener('click', closeTxModal);
        document.getElementById('bankModalCloseBtn').addEventListener('click', closeBankModal);
        bankModalOverlay.addEventListener('click', closeBankModal);

        // --- Handle Bank Details Form Submit ---
        bankDetailsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBankDetails(user.uid);
        });
    }
    
    // --- === NEW: Helper functions to lock/unlock form === ---
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

    // --- === UPDATED: loadBankDetails Function === ---
    function loadBankDetails(userId) {
        firebase.firestore().collection('users').doc(userId).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                // Check if bank details are already saved
                const hasBankDetails = userData.bankRealName && userData.bankRealName.length > 0;

                // Populate fields
                document.getElementById('bankRealName').value = userData.bankRealName || '';
                document.getElementById('bankAccount').value = userData.bankAccount || '';
                document.getElementById('bankConfirmAccount').value = userData.bankAccount || ''; // Pre-fill confirm
                document.getElementById('bankIFSC').value = userData.bankIFSC || '';
                document.getElementById('bankUPI').value = userData.bankUPI || '';

                // Lock or unlock the form based on whether details exist
                if (hasBankDetails) {
                    lockBankForm();
                } else {
                    unlockBankForm();
                }
            } else {
                // User doc doesn't exist, so form is unlocked
                unlockBankForm();
            }
        });
    }

    // --- === UPDATED: saveBankDetails Function === ---
    async function saveBankDetails(userId) {
        const saveBtn = document.getElementById('saveBankBtn');
        const form = document.getElementById('bankDetailsForm');
        
        // --- 1. Use HTML5 validation ---
        if (!form.checkValidity()) {
            alert('Please fill all fields correctly.');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        const name = document.getElementById('bankRealName').value;
        const account = document.getElementById('bankAccount').value;
        const confirmAccount = document.getElementById('bankConfirmAccount').value;
        const ifsc = document.getElementById('bankIFSC').value.toUpperCase(); // Force uppercase
        const upi = document.getElementById('bankUPI').value;

        // --- 2. Check account match ---
        if (account !== confirmAccount) {
            alert('Bank account numbers do not match. Please check.');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Details';
            return;
        }

        try {
            // --- 3. Save all data ---
            await firebase.firestore().collection('users').doc(userId).update({
                bankRealName: name,
                bankAccount: account,
                bankIFSC: ifsc,
                bankUPI: upi
            });
            
            alert('Bank details saved successfully!');
            lockBankForm(); // Lock the form immediately after saving
            document.getElementById('bankModalCloseBtn').click(); // Close modal

        } catch (error) {
            console.error("Error saving bank details: ", error);
            alert('Failed to save details. Please try again.');
        } finally {
            // Re-enable button
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Details';
        }
    }
    // --- === END OF UPDATED FUNCTION === ---


    function getTransactionIcon(type) {
        const cleanType = type.toLowerCase();
        
        if (cleanType.includes('invest')) return '💼'; 
        if (cleanType.includes('earning')) return '📈'; 
        if (cleanType.includes('deposit')) return '📥'; 
        if (cleanType.includes('withdrawal')) return '📤';
        if (cleanType.includes('adjust')) return '🔧'; 
        return '📄'; 
    }

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
                
