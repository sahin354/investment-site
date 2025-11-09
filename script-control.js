// System Control Panel - COMPLETE WORKING VERSION
console.log('🔧 Admin panel script loading...');

// Global variables
let allUsers = [];
let currentAdmin = null;
const SYSTEM_ADMINS = ["sahin54481@gmail.com", "admin@adani.com"];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded');
    initializeAdminPanel();
});

function initializeAdminPanel() {
    console.log('🚀 Starting admin panel...');
    checkAdminAuth();
}

// Authentication
function checkAdminAuth() {
    console.log('🔐 Checking auth...');
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user && SYSTEM_ADMINS.includes(user.email.toLowerCase())) {
            currentAdmin = user;
            console.log('✅ Admin access:', user.email);
            showControlPanel();
        } else {
            console.log('❌ Not admin or not logged in');
            if (user) {
                alert('Access Denied');
                firebase.auth().signOut();
            }
            window.location.href = 'system-control.html';
        }
    }, function(error) {
        console.error('Auth error:', error);
        window.location.href = 'system-control.html';
    });
}

function showControlPanel() {
    console.log('🎯 Showing panel...');
    loadDashboardStats();
    loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
    console.log('⚙️ Setting up listeners...');
    
    // Tab switching
    var tabs = document.querySelectorAll('.control-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var tabName = this.getAttribute('data-tab');
            
            // Remove active from all tabs
            tabs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Hide all content
            var contents = document.querySelectorAll('.tab-content');
            contents.forEach(function(content) {
                content.classList.remove('active');
            });
            
            // Show selected content
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
    
    // Plan modal
    document.getElementById('createNewPlanBtn').addEventListener('click', function() {
        showPlanForm();
    });
    document.getElementById('closePlanModal').addEventListener('click', function() {
        document.getElementById('planModal').style.display = 'none';
    });
    document.getElementById('planForm').addEventListener('submit', savePlan);
    
    // Plan auto-calculation
    var dailyReturnInput = document.getElementById('planDailyReturn');
    var durationInput = document.getElementById('planDuration');
    var totalReturnInput = document.getElementById('planTotalReturn');
    
    if (dailyReturnInput && durationInput && totalReturnInput) {
        dailyReturnInput.addEventListener('input', calculateTotalReturn);
        durationInput.addEventListener('input', calculateTotalReturn);
    }
    
    // User details modal
    setupUserDetailsModal();
    
    console.log('✅ Listeners setup complete');
}

function calculateTotalReturn() {
    var daily = parseFloat(document.getElementById('planDailyReturn').value) || 0;
    var duration = parseInt(document.getElementById('planDuration').value) || 0;
    var total = daily * duration;
    document.getElementById('planTotalReturn').value = total.toFixed(1);
}

// Dashboard functions
function loadDashboardStats() {
    console.log('📊 Loading stats...');
    
    firebase.firestore().collection('users').get().then(function(snapshot) {
        var userCount = snapshot.size;
        var totalBalance = 0;
        
        snapshot.forEach(function(doc) {
            var userData = doc.data();
            totalBalance += userData.balance || 0;
        });
        
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = userCount;
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        
        console.log('✅ Stats loaded:', userCount, 'users, ₹', totalBalance);
    }).catch(function(error) {
        console.error('❌ Error loading stats:', error);
    });
}

function loadUsers() {
    console.log('👥 Loading users...');
    var tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading users...</td></tr>';
    
    firebase.firestore().collection('users').orderBy('createdAt', 'desc').get().then(function(snapshot) {
        allUsers = [];
        snapshot.forEach(function(doc) {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        renderUsersTable();
        console.log('✅ Users loaded:', allUsers.length);
    }).catch(function(error) {
        console.error('❌ Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading users</td></tr>';
    });
}

function renderUsersTable() {
    var searchTerm = document.getElementById('searchUser').value.toLowerCase();
    var tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    var filteredUsers = allUsers.filter(function(user) {
        if (!searchTerm) return true;
        return (user.email && user.email.toLowerCase().includes(searchTerm)) || 
               user.id.toLowerCase().includes(searchTerm);
    });
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
        return;
    }
    
    filteredUsers.forEach(function(user) {
        var row = document.createElement('tr');
        var joinDate = user.createdAt && user.createdAt.seconds ? 
            new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        var isBlocked = user.isBlocked || false;
        
        row.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td><a href="#" class="user-email-link" data-userid="${user.id}">${user.email || 'N/A'}</a></td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${joinDate}</td>
            <td>${isBlocked ? 'Blocked' : 'Active'}</td>
            <td>
                <button class="action-btn block-btn" data-userid="${user.id}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add click events
    tbody.querySelectorAll('.user-email-link').forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var userId = this.getAttribute('data-userid');
            showUserDetails(userId);
        });
    });
    
    tbody.querySelectorAll('.block-btn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var userId = this.getAttribute('data-userid');
            var isBlocked = this.textContent === 'Unblock';
            toggleUserBlock(userId, !isBlocked);
        });
    });
}

function toggleUserBlock(userId, shouldBlock) {
    var action = shouldBlock ? 'block' : 'unblock';
    if (!confirm('Are you sure you want to ' + action + ' this user?')) return;
    
    firebase.firestore().collection('users').doc(userId).update({
        isBlocked: shouldBlock
    }).then(function() {
        alert('User ' + action + 'ed successfully!');
        loadUsers();
    }).catch(function(error) {
        console.error('Error blocking user:', error);
        alert('Error: ' + error.message);
    });
}

function loadUserDropdown() {
    var select = document.getElementById('userSelect');
    select.innerHTML = '<option value="">Select user...</option>';
    
    allUsers.forEach(function(user) {
        var option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.email + ' (₹' + (user.balance || 0).toFixed(2) + ')';
        select.appendChild(option);
    });
}

function updateUserBalance() {
    var userId = document.getElementById('userSelect').value;
    var action = document.getElementById('balanceAction').value;
    var amount = parseFloat(document.getElementById('balanceAmount').value);
    var reason = document.getElementById('balanceReason').value;
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select user and enter valid amount');
        return;
    }
    
    var userRef = firebase.firestore().collection('users').doc(userId);
    var txRef = firebase.firestore().collection('transactions').doc();
    
    firebase.firestore().runTransaction(function(transaction) {
        return transaction.get(userRef).then(function(userDoc) {
            if (!userDoc.exists) throw new Error("User not found");
            
            var userData = userDoc.data();
            var currentBalance = userData.balance || 0;
            var newBalance, txAmount, txType;
            
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
            
            if (newBalance < 0) throw new Error("Balance cannot be negative");
            
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
    }).then(function() {
        alert('Balance updated successfully!');
        loadUsers();
        loadDashboardStats();
    }).catch(function(error) {
        alert('Error: ' + error.message);
    });
}

function saveSystemSettings() {
    var settings = {
        commission1: parseFloat(document.getElementById('commission1').value),
        commission2: parseFloat(document.getElementById('commission2').value),
        commission3: parseFloat(document.getElementById('commission3').value),
        minWithdrawal: parseFloat(document.getElementById('minWithdrawal').value),
        maxWithdrawal: parseFloat(document.getElementById('maxWithdrawal').value)
    };
    
    firebase.firestore().collection('systemSettings').doc('config').set(settings, { merge: true })
        .then(function() {
            alert('Settings saved!');
        })
        .catch(function(error) {
            alert('Error saving settings: ' + error.message);
        });
}

function logoutControl() {
    if (confirm('Logout?')) {
        firebase.auth().signOut().then(function() {
            window.location.href = 'system-control.html';
        });
    }
}

// User Details Modal Functions
function setupUserDetailsModal() {
    var modal = document.getElementById('userDetailsModal');
    var closeBtn = document.getElementById('closeUserDetailsModal');
    var saveBtn = document.getElementById('saveBankDetailsBtn');
    
    closeBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    saveBtn.addEventListener('click', saveUserBankDetails);
}

function showUserDetails(userId) {
    console.log('Showing details for:', userId);
    
    var user = allUsers.find(function(u) { return u.id === userId; });
    if (!user) {
        alert('User not found');
        return;
    }
    
    document.getElementById('userDetailsTitle').textContent = 'User Details - ' + user.email;
    document.getElementById('userBankRealName').value = user.bankRealName || '';
    document.getElementById('userBankName').value = user.bankName || '';
    document.getElementById('userBankAccount').value = user.bankAccount || '';
    document.getElementById('userBankIFSC').value = user.bankIFSC || '';
    document.getElementById('userBankUPI').value = user.bankUPI || '';
    document.getElementById('userPhone').value = user.phone || '';
    
    loadUserTransactionHistory(userId);
    
    var modal = document.getElementById('userDetailsModal');
    modal.setAttribute('data-current-user-id', userId);
    modal.style.display = 'block';
}

function loadUserTransactionHistory(userId) {
    console.log('📊 Loading transaction history for user:', userId);
    
    var transactionList = document.getElementById('userTransactionList');
    transactionList.innerHTML = '<p>Loading transactions...</p>';
    
    firebase.firestore().collection('transactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
        .then(function(snapshot) {
            console.log('Found', snapshot.size, 'transactions');
            
            if (snapshot.empty) {
                transactionList.innerHTML = '<p>No transactions found for this user.</p>';
                return;
            }
            
            transactionList.innerHTML = '';
            snapshot.forEach(function(doc) {
                var tx = doc.data();
                var amount = tx.amount || 0;
                var date = tx.timestamp ? 
                    new Date(tx.timestamp.seconds * 1000).toLocaleString() : 
                    'Unknown date';
                
                var txHTML = `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <span class="transaction-type">${tx.type || 'Transaction'}</span>
                            <span class="transaction-info">${tx.details || 'No details'}</span>
                        </div>
                        <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                            ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                            <span class="transaction-date">${date}</span>
                        </div>
                    </div>
                `;
                transactionList.innerHTML += txHTML;
            });
        })
        .catch(function(error) {
            console.error('❌ Error loading transaction history:', error);
            
            // Try without ordering if there's an index error
            if (error.code === 'failed-precondition') {
                firebase.firestore().collection('transactions')
                    .where('userId', '==', userId)
                    .limit(50)
                    .get()
                    .then(function(snapshot) {
                        transactionList.innerHTML = '';
                        if (snapshot.empty) {
                            transactionList.innerHTML = '<p>No transactions found.</p>';
                            return;
                        }
                        
                        snapshot.forEach(function(doc) {
                            var tx = doc.data();
                            var amount = tx.amount || 0;
                            var date = tx.timestamp ? 
                                new Date(tx.timestamp.seconds * 1000).toLocaleString() : 
                                'Unknown date';
                            
                            var txHTML = `
                                <div class="transaction-item">
                                    <div class="transaction-details">
                                        <span class="transaction-type">${tx.type || 'Transaction'}</span>
                                        <span class="transaction-info">${tx.details || 'No details'}</span>
                                    </div>
                                    <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                                        ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                                        <span class="transaction-date">${date}</span>
                                    </div>
                                </div>
                            `;
                            transactionList.innerHTML += txHTML;
                        });
                    });
            } else {
                transactionList.innerHTML = '<p style="color:red;">Error loading transactions. Check console.</p>';
            }
        });
}

function saveUserBankDetails() {
    var modal = document.getElementById('userDetailsModal');
    var userId = modal.getAttribute('data-current-user-id');
    
    if (!userId) {
        alert('No user selected');
        return;
    }
    
    var bankData = {
        bankRealName: document.getElementById('userBankRealName').value,
        bankName: document.getElementById('userBankName').value,
        bankAccount: document.getElementById('userBankAccount').value,
        bankIFSC: document.getElementById('userBankIFSC').value,
        bankUPI: document.getElementById('userBankUPI').value,
        phone: document.getElementById('userPhone').value
    };
    
    firebase.firestore().collection('users').doc(userId).update(bankData)
        .then(function() {
            alert('Bank details saved!');
            // Update local data
            var userIndex = allUsers.findIndex(function(u) { return u.id === userId; });
            if (userIndex !== -1) {
                allUsers[userIndex] = { ...allUsers[userIndex], ...bankData };
            }
        })
        .catch(function(error) {
            alert('Error saving: ' + error.message);
        });
}

// Plan Management Functions
function loadPlans() {
    console.log('📈 Loading investment plans...');
    var plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '<p>Loading plans...</p>';
    
    firebase.firestore().collection('investmentPlans')
        .orderBy('isVIP', 'desc')
        .orderBy('minAmount', 'asc')
        .get()
        .then(function(snapshot) {
            if (snapshot.empty) {
                plansContainer.innerHTML = '<p>No investment plans found. Click "Create New Plan" to add one.</p>';
                return;
            }
            
            plansContainer.innerHTML = '';
            snapshot.forEach(function(doc) {
                var plan = { id: doc.id, ...doc.data() };
                var planCard = document.createElement('div');
                planCard.className = 'plan-card ' + (plan.isVIP ? 'vip' : '');
                planCard.innerHTML = `
                    <div class="plan-header">
                        <div class="plan-title">
                            ${plan.name} 
                            ${plan.isVIP ? '<span class="vip-badge">VIP</span>' : ''}
                        </div>
                        <span style="color: ${plan.isActive ? 'green' : 'gray'}; font-weight: bold;">
                            ${plan.isActive ? '● Active' : '● Inactiv
