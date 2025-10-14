// System Control Panel JavaScript - FIXED VERSION
let allUsers = [];
let currentAdmin = null;

// Pre-defined system administrators
const SYSTEM_ADMINS = [
    "sahin54481@gmail.com",
    "admin@adani.com"
];

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('Control panel loaded, checking auth...');
    checkAdminAuth();
});

function checkAdminAuth() {
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
            // Check if user is system administrator
            if (SYSTEM_ADMINS.includes(user.email)) {
                currentAdmin = user;
                console.log('✅ Admin access granted for:', user.email);
                initializeControlPanel();
            } else {
                console.log('❌ Access denied for:', user.email);
                alert('Access Denied: Administrator privileges required.');
                firebase.auth().signOut();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            }
        } else {
            console.log('🔐 No user, redirecting to login');
            window.location.href = 'system-control.html';
        }
    });
}

function initializeControlPanel() {
    console.log('🚀 Control panel initialized for:', currentAdmin.email);
    
    // Update admin info in header
    document.querySelector('.control-header h1').innerHTML = `🔒 System Control Panel - <small>${currentAdmin.email}</small>`;
    
    loadDashboardStats();
    loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Tab switching
    const tabs = document.querySelectorAll('.control-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName + 'Tab').classList.add('active');
            
            // Load tab-specific data
            if (tabName === 'plans') {
                loadPlans();
            } else if (tabName === 'balance') {
                loadUserDropdown();
            }
        });
    });
    
    // Logout button
    const logoutBtn = document.querySelector('.logout-control');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logoutControl);
    }
}

function loadDashboardStats() {
    const usersRef = firebase.firestore().collection('users');
    
    usersRef.get().then((snapshot) => {
        const userCount = snapshot.size;
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = userCount;
        
        let totalBalance = 0;
        snapshot.forEach(doc => {
            const userData = doc.data();
            totalBalance += userData.balance || 0;
        });
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        
        console.log('📊 Dashboard stats loaded:', { users: userCount, balance: totalBalance });
    }).catch((error) => {
        console.error('Error loading dashboard stats:', error);
    });
}

function loadUsers() {
    const usersRef = firebase.firestore().collection('users');
    const tbody = document.getElementById('usersTableBody');
    
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Loading users...</td></tr>';
    
    usersRef.orderBy('createdAt', 'desc').get().then((snapshot) => {
        allUsers = [];
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found</td></tr>';
            return;
        }
        
        snapshot.forEach(doc => {
            const userData = doc.data();
            allUsers.push({
                id: doc.id,
                ...userData
            });
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${doc.id.substring(0, 10)}...</td>
                <td>${userData.email || 'N/A'}</td>
                <td>₹${(userData.balance || 0).toFixed(2)}</td>
                <td>${userData.createdAt ? userData.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                <td><span class="status-badge ${userData.isBlocked ? 'blocked' : 'active'}">${userData.isBlocked ? 'Blocked' : 'Active'}</span></td>
                <td>
                    <button class="action-btn edit-btn" onclick="editUser('${doc.id}')">Edit</button>
                    <button class="action-btn block-btn" onclick="toggleUserBlock('${doc.id}', ${!userData.isBlocked})">
                        ${userData.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        console.log('👥 Users loaded:', allUsers.length);
    }).catch((error) => {
        console.error('Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading users</td></tr>';
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    
    if (!searchTerm) {
        loadUsers();
        return;
    }
    
    const filteredUsers = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.id.toLowerCase().includes(searchTerm)
    );
    
    tbody.innerHTML = '';
    
    if (filteredUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No matching users found</td></tr>';
        return;
    }
    
    filteredUsers.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.id.substring(0, 10)}...</td>
            <td>${user.email || 'N/A'}</td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
            <td><span class="status-badge ${user.isBlocked ? 'blocked' : 'active'}">${user.isBlocked ? 'Blocked' : 'Active'}</span></td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${user.id}')">Edit</button>
                <button class="action-btn block-btn" onclick="toggleUserBlock('${user.id}', ${!user.isBlocked})">
                    ${user.isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function loadUserDropdown() {
    const select = document.getElementById('userSelect');
    select.innerHTML = '<option value="">Select a user...</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.email} (₹${(user.balance || 0).toFixed(2)})`;
        select.appendChild(option);
    });
}

function updateUserBalance() {
    const userId = document.getElementById('userSelect').value;
    const action = document.getElementById('balanceAction').value;
    const amount = parseFloat(document.getElementById('balanceAmount').value);
    const reason = document.getElementById('balanceReason').value;
    
    if (!userId) {
        alert('Please select a user.');
        return;
    }
    
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount.');
        return;
    }
    
    const userRef = firebase.firestore().collection('users').doc(userId);
    
    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            let newBalance = userData.balance || 0;
            
            switch(action) {
                case 'add':
                    newBalance += amount;
                    break;
                case 'subtract':
                    newBalance = Math.max(0, newBalance - amount);
                    break;
                case 'set':
                    newBalance = amount;
                    break;
            }
            
            return userRef.update({
                balance: newBalance,
                lastBalanceUpdate: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Record transaction
                const transactionRef = firebase.firestore().collection('transactions').doc();
                return transactionRef.set({
                    userId: userId,
                    type: 'admin_adjustment',
                    amount: action === 'add' ? amount : -amount,
                    previousBalance: userData.balance || 0,
                    newBalance: newBalance,
                    reason: reason || 'Admin adjustment',
                    adminId: currentAdmin.uid,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            });
        } else {
            throw new Error('User not found');
        }
    }).then(() => {
        alert('✅ Balance updated successfully!');
        document.getElementById('balanceAmount').value = '';
        document.getElementById('balanceReason').value = '';
        loadUsers();
        loadDashboardStats();
    }).catch((error) => {
        console.error('Error updating balance:', error);
        alert('❌ Error: ' + error.message);
    });
}

function toggleUserBlock(userId, block) {
    const action = block ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
        return;
    }
    
    firebase.firestore().collection('users').doc(userId).update({
        isBlocked: block,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert(`✅ User ${action}ed successfully!`);
        loadUsers();
    }).catch((error) => {
        console.error('Error updating user:', error);
        alert('❌ Error updating user status.');
    });
}

function editUser(userId) {
    alert('Edit user functionality coming soon!');
}

// Investment Plans Management
function loadPlans() {
    const plansRef = firebase.firestore().collection('investmentPlans');
    const plansList = document.getElementById('plansList');
    
    plansList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading investment plans...</div>';
    
    plansRef.orderBy('isVIP', 'desc').orderBy('minAmount', 'asc').get().then((snapshot) => {
        if (snapshot.empty) {
            plansList.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>No investment plans found.</p>
                    <button class="submit-btn" onclick="showAddPlanForm()">Create First Plan</button>
                </div>
            `;
            return;
        }
        
        plansList.innerHTML = '<h4>📊 Investment Plans</h4>';
        snapshot.forEach(doc => {
            const plan = doc.data();
            const planCard = document.createElement('div');
            planCard.className = 'card';
            planCard.style.marginBottom = '15px';
            planCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h4>${plan.name} ${plan.isVIP ? '🌟 VIP' : ''}</h4>
                        <p><strong>Investment:</strong> ₹${plan.minAmount.toLocaleString()} - ₹${plan.maxAmount.toLocaleString()}</p>
                        <p><strong>Daily Return:</strong> ${plan.dailyReturn}%</p>
                        <p><strong>Duration:</strong> ${plan.duration} days</p>
                        <p><strong>Total Return:</strong> ${plan.totalReturn || (plan.dailyReturn * plan.duration)}%</p>
                        <p><strong>Status:</strong> ${plan.isActive ? '🟢 Active' : '🔴 Inactive'}</p>
                    </div>
                    <div class="control-actions">
                        <button class="action-btn edit-btn" onclick="editPlan('${doc.id}')">Edit</button>
                        <button class="action-btn ${plan.isActive ? 'block-btn' : 'edit-btn'}" onclick="togglePlanStatus('${doc.id}', ${!plan.isActive})">
                            ${plan.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            `;
            plansList.appendChild(planCard);
        });
        
        const addButton = document.createElement('div');
        addButton.style.marginTop = '20px';
        addButton.innerHTML = '<button class="submit-btn" onclick="showAddPlanForm()">➕ Add New Investment Plan</button>';
        plansList.appendChild(addButton);
        
    }).catch((error) => {
        console.error('Error loading plans:', error);
        plansList.innerHTML = '<div style="text-align: center; color: red;">Error loading investment plans</div>';
    });
}

function showAddPlanForm() {
    const planForm = `
        <div class="card">
            <h4>Create New Investment Plan</h4>
            <div class="form-group">
                <label>Plan Name</label>
                <input type="text" id="planName" placeholder="Enter plan name" class="form-control">
            </div>
            <div class="form-group">
                <label>Minimum Investment (₹)</label>
                <input type="number" id="planMinAmount" placeholder="Minimum investment amount" class="form-control">
            </div>
            <div class="form-group">
                <label>Maximum Investment (₹)</label>
                <input type="number" id="planMaxAmount" placeholder="Maximum investment amount" class="form-control">
            </div>
            <div class="form-group">
                <label>Daily Return (%)</label>
                <input type="number" id="planDailyReturn" placeholder="Daily return percentage" step="0.01" class="form-control">
            </div>
            <div class="form-group">
                <label>Plan Duration (days)</label>
                <input type="number" id="planDuration" placeholder="Duration in days" class="form-control">
            </div>
            <div class="form-group">
                <label>Total Return (%)</label>
                <input type="number" id="planTotalReturn" placeholder="Auto-calculated" readonly class="form-control">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="planIsVIP"> VIP Plan (Special benefits)
                </label>
            </div>
            <div class="form-group">
                <label>Plan Description</label>
                <textarea id="planDescription" placeholder="Describe this plan" class="form-control"></textarea>
            </div>
            <div class="control-actions">
                <button class="submit-btn" onclick="saveNewPlan()">💾 Save Plan</button>
                <button class="action-btn block-btn" onclick="loadPlans()">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('plansList').innerHTML = planForm;
    
    // Auto-calculate total return
    document.getElementById('planDailyReturn').addEventListener('input', calculateTotalReturn);
    document.getElementById('planDuration').addEventListener('input', calculateTotalReturn);
}

function calculateTotalReturn() {
    const dailyReturn = parseFloat(document.getElementById('planDailyReturn').value) || 0;
    const duration = parseInt(document.getElementById('planDuration').value) || 0;
    const totalReturn = dailyReturn * duration;
    document.getElementById('planTotalReturn').value = totalReturn;
}

function saveNewPlan() {
    const planData = {
        name: document.getElementById('planName').value,
        minAmount: parseFloat(document.getElementById('planMinAmount').value),
        maxAmount: parseFloat(document.getElementById('planMaxAmount').value),
        dailyReturn: parseFloat(document.getElementById('planDailyReturn').value),
        duration: parseInt(document.getElementById('planDuration').value),
        totalReturn: parseFloat(document.getElementById('planTotalReturn').value),
        isVIP: document.getElementById('planIsVIP').checked,
        description: document.getElementById('planDescription').value,
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validation
    if (!planData.name || !planData.minAmount || !planData.maxAmount || !planData.dailyReturn || !planData.duration) {
        alert('Please fill all required fields.');
        return;
    }
    
    if (planData.minAmount >= planData.maxAmount) {
        alert('Maximum amount must be greater than minimum amount.');
        return;
    }
    
    firebase.firestore().collection('investmentPlans').add(planData).then(() => {
        alert('✅ Investment plan created successfully!');
        loadPlans();
    }).catch((error) => {
        console.error('Error adding plan:', error);
        alert('❌ Error creating plan: ' + error.message);
    });
}

function editPlan(planId) {
    alert('Edit plan functionality coming soon!');
}

function togglePlanStatus(planId, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this plan?`)) {
        return;
    }
    
    firebase.firestore().collection('investmentPlans').doc(planId).update({
        isActive: newStatus,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert(`✅ Plan ${action}d successfully!`);
        loadPlans();
    }).catch((error) => {
        console.error('Error updating plan status:', error);
        alert('❌ Error updating plan status.');
    });
}

function saveSystemSettings() {
    const settings = {
        commission1: parseInt(document.getElementById('commission1').value) || 21,
        commission2: parseInt(document.getElementById('commission2').value) || 3,
        commission3: parseInt(document.getElementById('commission3').value) || 1,
        minWithdrawal: parseInt(document.getElementById('minWithdrawal').value) || 100,
        maxWithdrawal: parseInt(document.getElementById('maxWithdrawal').value) || 50000,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    firebase.firestore().collection('systemSettings').doc('commissionRates').set(settings)
    .then(() => {
        alert('✅ Settings saved successfully!');
    })
    .catch((error) => {
        console.error('Error saving settings:', error);
        alert('❌ Error saving settings.');
    });
}

function logoutControl() {
    if (confirm('Are you sure you want to logout from admin panel?')) {
        console.log('Logging out admin...');
        firebase.auth().signOut().then(() => {
            console.log('Admin logged out successfully');
            window.location.href = 'system-control.html';
        }).catch((error) => {
            console.error('Logout error:', error);
            alert('Logout failed. Please try again.');
        });
    }
}

// Add CSS for status badges
const style = document.createElement('style');
style.textContent = `
    .status-badge {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 0.8em;
        font-weight: bold;
    }
    .status-badge.active {
        background: #d4edda;
        color: #155724;
    }
    .status-badge.blocke
