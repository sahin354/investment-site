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
        // --- Modal Elements ---
        const modalContainer = document.getElementById('txModalContainer');
        const modalOverlay = document.getElementById('txModalOverlay');
        const modalContent = document.getElementById('txModalContent');

        // Function to open the modal
        const openModal = () => {
            // --- THIS IS THE FIX ---
            // Changed from 'block' to 'flex' to apply the layout
            modalContainer.style.display = 'flex'; 
            modalOverlay.style.display = 'block';
            document.body.classList.add('modal-open');
            // Load history every time it's opened
            loadTransactionHistory(user.uid); 
        };

        // Function to close the modal
        const closeModal = () => {
            modalContainer.style.display = 'none';
            modalOverlay.style.display = 'none';
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
            alert('This feature is coming soon!');
        });
         document.getElementById('changePasswordBtn').addEventListener('click', (e) => {
            e.preventDefault();
            alert('This feature is coming soon!');
        });

        // Transaction button opens the modal
        document.getElementById('transactionHistoryBtn').addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });

        // Modal close buttons
        document.getElementById('txModalCloseBtn').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', closeModal);
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
            
            listContainer.innerHTML = ''; // Clear loading message

            const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            docs.sort((a, b) => {
                const dateA = a.timestamp ? a.timestamp.seconds : 0;
                const dateB = b.timestamp ? b.timestamp.seconds : 0;
                return dateB - dateA; // Sort descending (newest first)
            });

            docs.forEach((tx) => {
                const amount = tx.amount;
                const date = tx.timestamp ? tx.timestamp.toDate().toLocaleString() : 'Just now';
                
                const txHTML = `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <span class="transaction-type">${tx.type}</span>
                            <span class="transaction-info">${tx.details}</span>
                        </div>
                        <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                            ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                            <span class="transaction-date">${date}</span>
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
