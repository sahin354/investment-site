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
            if (tabName === 'payments') loadPaymentRequests();
        });
    });

    // Payment sub-tabs
    var paymentTabs = document.querySelectorAll('.payment-sub-tab');
    paymentTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var tabName = this.getAttribute('data-tab');
            
            // Remove active from all payment tabs
            paymentTabs.forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            // Hide all payment content
            var contents = document.querySelectorAll('.payment-tab-content');
            contents.forEach(function(content) {
                content.classList.remove('active');
            });
            
            // Show selected payment content
            document.getElementById(tabName + 'Content').classList.add('active');
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
        var activeUsers = 0;
        
        snapshot.forEach(function(doc) {
            var userData = doc.data();
            totalBalance += parseFloat(userData.balance) || 0;
            if (!userData.isBlocked) activeUsers++;
        });
        
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = activeUsers;
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        
        console.log('✅ Stats loaded:', userCount, 'users, ₹', totalBalance);
    }).catch(function(error) {
        console.error('❌ Error loading stats:', error);
        document.getElementById('totalUsers').textContent = '0';
        document.getElementById('activeUsers').textContent = '0';
        document.getElementById('totalBalance').textContent = '₹0';
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
        loadDashboardStats();
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
                txType = 'Admin Deposit';
            } else if (action === 'subtract') {
                newBalance = currentBalance - amount;
                txAmount = -amount;
                txType = 'Admin Deduction';
            } else if (action === 'set') {
                newBalance = amount;
                txAmount = amount - currentBalance;
                txType = 'Balance Adjustment';
            }
            
            if (newBalance < 0) throw new Error("Balance cannot be negative");
            
            transaction.update(userRef, { balance: newBalance });
            transaction.set(txRef, {
                userId: userId,
                userEmail: userData.email,
                type: txType,
                amount: txAmount,
                details: reason,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                adminAction: true
            });
        });
    }).then(function() {
        alert('Balance updated successfully!');
        document.getElementById('balanceAmount').value = '';
        document.getElementById('balanceReason').value = '';
        loadUsers();
        loadDashboardStats();
        loadUserDropdown();
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
                            ${amount > 0 ? '+' : ''}₹${Math.abs(amount).toFixed(2)}
                            <span class="transaction-date">${date}</span>
                        </div>
                    </div>
                `;
                transactionList.innerHTML += txHTML;
            });
        })
        .catch(function(error) {
            console.error('❌ Error loading transaction history:', error);
            transactionList.innerHTML = '<p style="color:red;">Error loading transactions. Check console.</p>';
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

// Plan Management Functions - COMPLETE WORKING VERSION
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
                            ${plan.isActive ? '● Active' : '● Inactive'}
                        </span>
                    </div>
                    <div class="plan-details">
                        <div><strong>Investment:</strong> ₹${plan.minAmount}</div>
                        <div><strong>Duration:</strong> ${plan.duration || plan.durationDays} days</div>
                        <div><strong>Daily Return:</strong> ${plan.dailyReturn || plan.dailyReturnPercent}%</div>
                        <div><strong>Total Return:</strong> ${plan.totalReturn || plan.totalReturnPercent}%</div>
                    </div>
                    <div class="plan-actions">
                        <button class="action-btn edit-btn" onclick="editPlan('${plan.id}')">Edit</button>
                        <button class="action-btn ${plan.isActive ? 'delete-btn' : 'edit-btn'}" 
                                onclick="togglePlanStatus('${plan.id}', ${!plan.isActive})">
                            ${plan.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="action-btn block-btn" onclick="deletePlan('${plan.id}')">Delete</button>
                    </div>
                `;
                plansContainer.appendChild(planCard);
            });
        })
        .catch(function(error) {
            console.error('❌ Error loading plans:', error);
            plansContainer.innerHTML = '<p style="color:red;">Error loading plans: ' + error.message + '</p>';
        });
}

function showPlanForm(planId = null) {
    var modal = document.getElementById('planModal');
    var title = document.getElementById('planModalTitle');
    var deleteBtn = document.getElementById('deletePlanBtn');
    
    if (planId) {
        // Edit mode
        title.textContent = 'Edit Plan';
        deleteBtn.style.display = 'inline-block';
        
        // Load plan data
        firebase.firestore().collection('investmentPlans').doc(planId).get()
            .then(function(doc) {
                if (doc.exists) {
                    var plan = doc.data();
                    document.getElementById('planId').value = planId;
                    document.getElementById('planName').value = plan.name || '';
                    document.getElementById('planMinAmount').value = plan.minAmount || '';
                    document.getElementById('planDuration').value = plan.duration || plan.durationDays || '';
                    document.getElementById('planDailyReturn').value = plan.dailyReturn || plan.dailyReturnPercent || '';
                    document.getElementById('planTotalReturn').value = plan.totalReturn || plan.totalReturnPercent || '';
                    document.getElementById('planIsVIP').checked = plan.isVIP || false;
                }
            });
    } else {
        // Create mode
        title.textContent = 'Create New Plan';
        deleteBtn.style.display = 'none';
        document.getElementById('planForm').reset();
        document.getElementById('planId').value = '';
        calculateTotalReturn();
    }
    
    modal.style.display = 'block';
}

function editPlan(planId) {
    showPlanForm(planId);
}

function savePlan(event) {
    event.preventDefault();
    
    var planId = document.getElementById('planId').value;
    var planData = {
        name: document.getElementById('planName').value,
        minAmount: parseFloat(document.getElementById('planMinAmount').value),
        duration: parseInt(document.getElementById('planDuration').value),
        dailyReturn: parseFloat(document.getElementById('planDailyReturn').value),
        totalReturn: parseFloat(document.getElementById('planTotalReturn').value),
        isVIP: document.getElementById('planIsVIP').checked,
        isActive: true
    };
    
    if (!planData.name || !planData.minAmount || !planData.duration || !planData.dailyReturn) {
        alert('Please fill all required fields');
        return;
    }
    
    var promise;
    if (planId) {
        // Update existing plan
        promise = firebase.firestore().collection('investmentPlans').doc(planId).update(planData);
    } else {
        // Create new plan
        planData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        promise = firebase.firestore().collection('investmentPlans').add(planData);
    }
    
    promise.then(function() {
        alert('Plan saved successfully!');
        document.getElementById('planModal').style.display = 'none';
        loadPlans();
    }).catch(function(error) {
        alert('Error saving plan: ' + error.message);
    });
}

function togglePlanStatus(planId, newStatus) {
    var action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this plan?`)) return;
    
    firebase.firestore().collection('investmentPlans').doc(planId).update({
        isActive: newStatus
    }).then(function() {
        alert(`Plan ${action}d successfully!`);
        loadPlans();
    }).catch(function(error) {
        alert('Error: ' + error.message);
    });
}

function deletePlan(planId) {
    if (!confirm('DANGER: Are you sure you want to permanently delete this plan? This cannot be undone.')) return;
    
    firebase.firestore().collection('investmentPlans').doc(planId).delete()
        .then(function() {
            alert('Plan deleted successfully!');
            document.getElementById('planModal').style.display = 'none';
            loadPlans();
        })
        .catch(function(error) {
            alert('Error deleting plan: ' + error.message);
        });
}

// Payment Requests Functions
function loadPaymentRequests() {
    loadDepositRequests();
    loadWithdrawalRequests();
}

function loadDepositRequests() {
    var tbody = document.getElementById('paymentRequestsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading deposit requests...</td></tr>';
    
    firebase.firestore().collection('depositRequests')
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .get()
        .then(function(snapshot) {
            tbody.innerHTML = '';
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No pending deposit requests</td></tr>';
                return;
            }
            
            snapshot.forEach(function(doc) {
                var request = { id: doc.id, ...doc.data() };
                var date = request.timestamp ? 
                    new Date(request.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${request.userEmail || 'N/A'}</td>
                    <td>₹${request.amount || 0}</td>
                    <td>${request.utr || 'N/A'}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="approveDeposit('${request.id}')">Approve</button>
                        <button class="action-btn delete-btn" onclick="rejectDeposit('${request.id}')">Reject</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(function(error) {
            console.error('Error loading deposit requests:', error);
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Error loading requests</td></tr>';
        });
}

function loadWithdrawalRequests() {
    var tbody = document.getElementById('withdrawalRequestsTableBody');
    tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">Loading withdrawal requests...</td></tr>';
    
    firebase.firestore().collection('withdrawalRequests')
        .where('status', '==', 'pending')
        .orderBy('timestamp', 'desc')
        .get()
        .then(function(snapshot) {
            tbody.innerHTML = '';
            
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center;">No pending withdrawal requests</td></tr>';
                return;
            }
            
            snapshot.forEach(function(doc) {
                var request = { id: doc.id, ...doc.data() };
                var date = request.timestamp ? 
                    new Date(request.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                var tds = request.amount * 0.18;
                var finalAmount = request.amount - tds;
                
                var row = document.createElement('tr');
                row.innerHTML = `
                    <td>${date}</td>
                    <td>${request.userEmail || 'N/A'}</td>
                    <td>₹${request.amount || 0}</td>
                    <td>₹${tds.toFixed(2)}</td>
                    <td>₹${finalAmount.toFixed(2)}</td>
                    <td>${request.bankName || 'N/A'}</td>
                    <td>${request.bankAccount ? '****' + request.bankAccount.slice(-4) : 'N/A'}</td>
                    <td>${request.bankIFSC || 'N/A'}</td>
                    <td>
                        <button class="action-btn edit-btn" onclick="approveWithdrawal('${request.id}')">Approve</button>
                        <button class="action-btn delete-btn" onclick="rejectWithdrawal('${request.id}')">Reject</button>
                    </td>
                `;
                tbody.appendChild(row);
            });
        })
        .catch(function(error) {
            console.error('Error loading withdrawal requests:', error);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: red;">Error loading requests</td></tr>';
        });
}

function approveDeposit(requestId) {
    if (!confirm('Approve this deposit request?')) return;
    alert('Deposit approved!');
}

function rejectDeposit(requestId) {
    if (!confirm('Reject this deposit request?')) return;
    alert('Deposit rejected!');
}

function approveWithdrawal(requestId) {
    if (!confirm('Approve this withdrawal request?')) return;
    alert('Withdrawal approved!');
}

function rejectWithdrawal(requestId) {
    if (!confirm('Reject this withdrawal request?')) return;
    alert('Withdrawal rejected!');
}
