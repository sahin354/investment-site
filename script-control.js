// System Control Panel JavaScript - FIXED VERSION
console.log('🔧 Admin panel script loading...');

// --- GLOBAL VARIABLES ---
let allUsers = [];
let currentAdmin = null;
const SYSTEM_ADMINS = ["sahin54481@gmail.com", "admin@adani.com"];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing admin panel...');
    initializeAdminPanel();
});

function initializeAdminPanel() {
    console.log('🚀 Starting admin panel initialization...');
    checkAdminAuth();
}

// --- AUTHENTICATION ---
function checkAdminAuth() {
    console.log('🔐 Checking admin authentication...');
    firebase.auth().onAuthStateChanged(user => {
        if (user && SYSTEM_ADMINS.includes(user.email.toLowerCase())) {
            currentAdmin = user;
            console.log('✅ Admin access granted for:', user.email);
            showControlPanel();
        } else {
            if (user) {
                console.log('❌ Access denied for non-admin:', user.email);
                alert('Access Denied: Administrator privileges required.');
                firebase.auth().signOut();
            } else {
                console.log('🔐 No authenticated user, redirecting to login...');
            }
            window.location.href = 'system-control.html';
        }
    }, error => {
        console.error('❌ Auth state error:', error);
        window.location.href = 'system-control.html';
    });
}

// --- MAIN PANEL LOGIC ---
function showControlPanel() {
    console.log('🎯 Showing control panel and loading data...');
    loadDashboardStats();
    loadUsers();
    setupAllEventListeners();
    console.log('✅ Control panel fully loaded!');
}

function setupAllEventListeners() {
    console.log('⚙️ Setting up event listeners...');
    
    // Tab switching
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.control-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');
            if (tabName === 'balance') loadUserDropdown();
            if (tabName === 'plans') loadPlans();
        });
    });

    // Buttons
    document.getElementById('logoutButton').addEventListener('click', logoutControl);
    document.getElementById('updateBalanceButton').addEventListener('click', updateUserBalance); 
    document.getElementById('saveSettingsButton').addEventListener('click', saveSystemSettings);
    document.getElementById('searchUser').addEventListener('input', renderUsersTable);

    // Plan Management Event Listeners
    const planModal = document.getElementById('planModal');
    document.getElementById('createNewPlanBtn').addEventListener('click', () => showPlanForm());
    document.getElementById('closePlanModal').addEventListener('click', () => planModal.style.display = 'none');
    document.getElementById('planForm').addEventListener('submit', savePlan);

    // User Details Modal Event Listeners
    document.getElementById('closeUserDetailsModal').addEventListener('click', () => {
        document.getElementById('userDetailsModal').style.display = 'none';
    });
    
    document.getElementById('editBankDetails').addEventListener('click', showBankEditForm);
    document.getElementById('removeBankDetails').addEventListener('click', removeUserBankDetails);
    document.getElementById('saveBankDetails').addEventListener('click', saveBankDetails);
    document.getElementById('cancelBankEdit').addEventListener('click', cancelBankEdit);

    // Auto-calculate total return
    const dailyReturnInput = document.getElementById('planDailyReturn');
    const durationInput = document.getElementById('planDuration');
    const totalReturnInput = document.getElementById('planTotalReturn');
    const calculateTotal = () => {
        const daily = parseFloat(dailyReturnInput.value) || 0;
        const duration = parseInt(durationInput.value) || 0;
        totalReturnInput.value = (daily * duration).toFixed(2);
    };
    dailyReturnInput.addEventListener('input', calculateTotal);
    durationInput.addEventListener('input', calculateTotal);

    window.onclick = event => {
        const planModal = document.getElementById('planModal');
        const userDetailsModal = document.getElementById('userDetailsModal');
        if (event.target == planModal) planModal.style.display = "none";
        if (event.target == userDetailsModal) userDetailsModal.style.display = "none";
    };

    console.log('✅ All event listeners setup complete.');
}

// --- DASHBOARD/USER FUNCTIONS ---
function loadDashboardStats() {
    console.log('📊 Loading dashboard stats...');
    const usersRef = firebase.firestore().collection('users');
    
    usersRef.get().then(snapshot => {
        const userCount = snapshot.size;
        let totalBalance = 0;
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            totalBalance += parseFloat(userData.balance) || 0;
        });
        
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = userCount;
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        
        console.log('✅ Dashboard stats loaded:', { userCount, totalBalance });
    }).catch(error => {
        console.error('❌ Error loading dashboard stats:', error);
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('activeUsers').textContent = '0';
        document.getElementById('totalBalance').textContent = '₹0';
    });
}

function loadUsers() {
    console.log('👥 Loading users...');
    const usersRef = firebase.firestore().collection('users').orderBy('createdAt', 'desc');
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">Loading...</td></tr>';
    
    usersRef.get().then(snapshot => {
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsersTable();
        console.log(`✅ Loaded ${allUsers.length} users.`);
    }).catch(error => {
        console.error('❌ Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: red;">Error loading users.</td></tr>';
    });
}

// --- UPDATED USER TABLE RENDER FUNCTION WITH CLICKABLE EMAILS ---
function renderUsersTable() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const usersToRender = searchTerm 
        ? allUsers.filter(user => 
            (user.email && user.email.toLowerCase().includes(searchTerm)) || 
            (user.id && user.id.toLowerCase().includes(searchTerm))
          ) 
        : allUsers;

    if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No users found.</td></tr>';
        return;
    }
    
    usersToRender.forEach(user => {
        const tr = document.createElement('tr');
        const joinDate = user.createdAt && user.createdAt.seconds ? 
            new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        const isBlocked = user.isBlocked || false;
        
        tr.innerHTML = `
            <td>${user.id ? user.id.substring(0, 8) + '...' : 'N/A'}</td>
            <td>
                <a href="#" class="user-email-link" data-userid="${user.id}" style="color: #1a237e; text-decoration: underline;">
                    ${user.email || 'N/A'}
                </a>
            </td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${joinDate}</td>
            <td>${isBlocked ? 'Blocked' : 'Active'}</td>
            <td>${user.bankName || 'N/A'}</td>
            <td>${user.bankAccount || 'N/A'}</td>
            <td>${user.bankIFSC || 'N/A'}</td>
            <td>${user.bankUPI || 'N/A'}</td>
            <td>
                <button class="action-btn block-btn" data-userid="${user.id}" data-is-blocked="${isBlocked}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Re-attach listeners for block buttons
    tbody.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userid;
            const isBlocked = this.dataset.isBlocked === 'true';
            toggleUserBlock(userId, !isBlocked);
        });
    });
    
    // Add click listeners to email links
    tbody.querySelectorAll('.user-email-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userid;
            showUserDetails(userId);
        });
    });
}

// --- NEW USER DETAILS FUNCTIONS ---
function showUserDetails(userId) {
    console.log('👤 Loading user details for:', userId);
    const modal = document.getElementById('userDetailsModal');
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    // Set modal title
    document.getElementById('userDetailsTitle').textContent = `User Details - ${user.email}`;
    
    // Display bank details
    document.getElementById('detailBankName').textContent = user.bankName || 'N/A';
    document.getElementById('detailBankRealName').textContent = user.bankRealName || 'N/A';
    document.getElementById('detailBankAccount').textContent = user.bankAccount || 'N/A';
    document.getElementById('detailBankIFSC').textContent = user.bankIFSC || 'N/A';
    document.getElementById('detailBankUPI').textContent = user.bankUPI || 'N/A';
    
    // Store current user ID for editing
    modal.dataset.currentUserId = userId;
    
    // Hide edit form initially
    document.getElementById('bankEditForm').style.display = 'none';
    
    // Load transaction history
    loadUserTransactions(userId);
    
    // Show modal
    modal.style.display = 'block';
}

function loadUserTransactions(userId) {
    const transactionList = document.getElementById('userTransactionList');
    transactionList.innerHTML = '<p>Loading transactions...</p>';
    
    firebase.firestore().collection('transactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                transactionList.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            transactionList.innerHTML = '';
            snapshot.forEach(doc => {
                const tx = doc.data();
                const item = document.createElement('div');
                item.className = 'transaction-item modern';
                
                const date = tx.timestamp && tx.timestamp.seconds 
                    ? new Date(tx.timestamp.seconds * 1000).toLocaleString()
                    : 'Unknown date';
                
                const amountClass = tx.amount >= 0 ? 'positive' : 'negative';
                const amountSign = tx.amount >= 0 ? '+' : '';
                
                item.innerHTML = `
                    <div class="transaction-icon">💰</div>
                    <div class="transaction-details">
                        <div class="transaction-type">${tx.type || 'Transaction'}</div>
                        <div class="transaction-info">${tx.details || 'No details'}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}₹${Math.abs(tx.amount || 0).toFixed(2)}
                    </div>
                `;
                
                transactionList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('❌ Error loading transactions:', error);
            transactionList.innerHTML = '<p style="color: red;">Error loading transactions.</p>';
        });
}

function showBankEditForm() {
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) return;
    
    // Populate form with current values
    document.getElementById('editBankName').value = user.bankName || '';
    document.getElementById('editBankRealName').value = user.bankRealName || '';
    document.getElementById('editBankAccount').value = user.bankAccount || '';
    document.getElementById('editBankIFSC').value = user.bankIFSC || '';
    document.getElementById('editBankUPI').value = user.bankUPI || '';
    
    // Show edit form
    document.getElementById('bankEditForm').style.display = 'block';
}

function cancelBankEdit() {
    document.getElementById('bankEditForm').style.display = 'none';
}

function saveBankDetails() {
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    
    const bankData = {
        bankName: document.getElementById('editBankName').value,
        bankRealName: document.getElementById('editBankRealName').value,
        bankAccount: document.getElementById('editBankAccount').value,
        bankIFSC: document.getElementById('editBankIFSC').value,
        bankUPI: document.getElementById('editBankUPI').value
    };
    
    firebase.firestore().collection('users').doc(userId).update(bankData)
        .then(() => {
            alert('✅ Bank details updated successfully!');
            // Update local data
            const userIndex = allUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                allUsers[userIndex] = { ...allUsers[userIndex], ...bankData };
            }
            // Refresh the display
            showUserDetails(userId);
            renderUsersTable(); // Update table
        })
        .catch(error => {
            console.error('❌ Error updating bank details:', error);
            alert('Error updating bank details: ' + error.message);
        });
}

function removeUserBankDetails() {
    if (!confirm('Are you sure you want to remove all bank details for this user?')) {
        return;
    }
    
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    
    const bankData = {
        bankName: firebase.firestore.FieldValue.delete(),
        bankRealName: firebase.firestore.FieldValue.delete(),
        bankAccount: firebase.firestore.FieldValue.delete(),
        bankIFSC: firebase.firestore.FieldValue.delete(),
        bankUPI: firebase.firestore.FieldValue.delete()
    };
    
    firebase.firestore().collection('users').doc(userId).update(bankData)
        .then(() => {
            alert('✅ Bank details removed successfully!');
            // Update local data
            const userIndex = allUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                allUsers[userIndex].bankName = null;
                allUsers[userIndex].bankRealName = null;
                allUsers[userIndex].bankAccount = null;
                allUsers[userIndex].bankIFSC = null;
                allUsers[userIndex].bankUPI = null;
            }
            // Refresh the display
            showUserDetails(userId);
            renderUsersTable(); // Update table
        })
        .catch(error => {
            console.error('❌ Error removing bank details:', error);
            alert('Error removing bank details: ' + error.message);
        });
}

// --- EXISTING FUNCTIONS ---
function toggleUserBlock(userId, shouldBlock) {
    const action = shouldBlock ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    firebase.firestore().collection('users').doc(userId).update({ isBlocked: shouldBlock })
        .then(() => {
            alert(`User ${action}ed successfully!`);
            loadUsers();
            loadDashboardStats();
        })
        .catch(error => console.error(`❌ Error ${action}ing user:`, error));
}

function loadUserDropdown() {
    console.log('📋 Loading user dropdown...');
    const select = document.getElementById('userSelect');
    select.innerHTML = '<option value="">Select a user...</option>';
    
    allUsers.sort((a, b) => (a.email || '').localeCompare(b.email || ''))
        .forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = `${user.email} (Balance: ₹${(user.balance || 0).toFixed(2)})`;
            select.appendChild(option);
        });
}

function updateUserBalance() {
    const userId = document.getElementById('userSelect').value;
    const action = document.getElementById('balanceAction').value;
    const amount = parseFloat(document.getElementById('balanceAmount').value);
    const reason = document.getElementById('balanceReason').value; 

    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid positive amount.');
        return;
    }

    const db = firebase.firestore(); 
    const userRef = db.collection('users').doc(userId);
    const txRef = db.collection('transactions').doc(); 

    firebase.firestore().runTransaction(transaction => {
        return transaction.get(userRef).then(userDoc => {
            if (!userDoc.exists) throw new Error("User not found!");
            
            const userData = userDoc.data();
            const currentBalance = parseFloat(userData.balance) || 0;
            let newBalance;
            let txAmount;
            let txType;

            if (action === 'add') {
                newBalance = currentBalance + amount;
                txAmount = amount; 
                txType = 'Deposit';
            } else if (action === 'subtract') {
                newBalance = currentBalance - amount;
                txAmount = -amount; 
                txType = 'Withdrawal';
            } else if (action === 'set') {
                newBalance = amount;
                txAmount = amount - currentBalance; 
                txType = 'Adjustment';
            }

            if (newBalance < 0) throw new Error("Balance cannot be negative.");

            transaction.update(userRef, { balance: newBalance });
            transaction.set(txRef, {
                userId: userId,
                userEmail: userData.email,
                type: txType, 
                amount: txAmount,
                details: reason, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }).then(() => {
        alert('Balance updated and transaction logged!');
        loadUsers();
        loadDashboardStats();
        loadUserDropdown();
    }).catch(error => {
        console.error('❌ Error updating balance:', error);
        alert('Failed to update balance: ' + error.message);
    });
}

// --- PLAN MANAGEMENT FUNCTIONS ---
function loadPlans() {
    console.log('📈 Loading investment plans...');
    const plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '<p>Loading plans...</p>';
    
    const plansRef = firebase.firestore().collection('investmentPlans').orderBy('isVIP', 'desc').orderBy('minAmount', 'asc');
    
    plansRef.onSnapshot(snapshot => {
        if (snapshot.empty) {
            plansContainer.innerHTML = '<p>No investment plans found. Click "Create New Plan" to add one.</p>';
          
