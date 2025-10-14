// System Control Panel JavaScript - COMPLETE FIX
console.log('🔧 Admin panel script loading...');

let allUsers = [];
let currentAdmin = null;

// Pre-defined system administrators
const SYSTEM_ADMINS = [
    "sahin54481@gmail.com",
    "admin@adani.com"
];

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ DOM loaded, initializing admin panel...');
    initializeAdminPanel();
});

function initializeAdminPanel() {
    console.log('🚀 Starting admin panel initialization...');
    
    // Check authentication first
    checkAdminAuth();
}

function checkAdminAuth() {
    console.log('🔐 Checking admin authentication...');
    
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('📡 Auth state changed:', user ? user.email : 'No user');
        
        if (user) {
            // Check if user is system administrator
            if (SYSTEM_ADMINS.includes(user.email)) {
                currentAdmin = user;
                console.log('✅ Admin access granted for:', user.email);
                showControlPanel();
            } else {
                console.log('❌ Access denied for:', user.email);
                alert('Access Denied: Administrator privileges required.');
                firebase.auth().signOut();
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);
            }
        } else {
            console.log('🔐 No authenticated user, redirecting to login...');
            window.location.href = 'system-control.html';
        }
    }, function(error) {
        console.error('❌ Auth state error:', error);
        alert('Authentication error. Please try again.');
        window.location.href = 'system-control.html';
    });
}

function showControlPanel() {
    console.log('🎯 Showing control panel...');
    
    // Make sure we're on the correct page
    if (!document.querySelector('.control-container')) {
        console.error('❌ Not on control panel page!');
        return;
    }
    
    // Update admin info in header
    const header = document.querySelector('.control-header h1');
    if (header) {
        header.innerHTML = `🔒 Admin Panel - <small>${currentAdmin.email}</small>`;
    }
    
    // Setup all functionality
    setupAllEventListeners();
    loadDashboardStats();
    loadUsers();
    
    console.log('✅ Control panel fully loaded!');
}

function setupAllEventListeners() {
    console.log('⚙️ Setting up event listeners...');
    
    // Tab switching
    const tabs = document.querySelectorAll('.control-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            console.log('📑 Tab clicked:', this.getAttribute('data-tab'));
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                tabContent.classList.add('active');
                
                // Load tab-specific data
                if (tabName === 'plans') {
                    loadPlans();
                } else if (tabName === 'balance') {
                    loadUserDropdown();
                }
            }
        });
    });
    
    // Search users
    const searchInput = document.getElementById('searchUser');
    if (searchInput) {
        searchInput.addEventListener('input', searchUsers);
    }
    
    // Update balance button
    const updateBalanceBtn = document.querySelector('button[onclick="updateUserBalance()"]');
    if (updateBalanceBtn) {
        updateBalanceBtn.addEventListener('click', updateUserBalance);
    }
    
    // Save settings button
    const saveSettingsBtn = document.querySelector('button[onclick="saveSystemSettings()"]');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', saveSystemSettings);
    }
    
    // Logout button - FIXED
    const logoutBtn = document.querySelector('.logout-control');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logoutControl();
        });
        console.log('✅ Logout button event listener added');
    } else {
        console.log('❌ Logout button not found');
    }
    
    console.log('✅ All event listeners setup complete');
}

function loadDashboardStats() {
    console.log('📊 Loading dashboard stats...');
    
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
        
        console.log('✅ Dashboard stats loaded');
    }).catch((error) => {
        console.error('❌ Error loading dashboard stats:', error);
    });
}

function loadUsers() {
    console.log('👥 Loading users...');
    
    const usersRef = firebase.firestore().collection('users');
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) {
        console.error('❌ Users table body not found');
        return;
    }
    
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
                    <button class="action-btn edit-btn" data-userid="${doc.id}">Edit</button>
                    <button class="action-btn block-btn" data-userid="${doc.id}" data-block="${!userData.isBlocked}">
                        ${userData.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
        
        // Add event listeners to action buttons
        setTimeout(() => {
            document.querySelectorAll('.block-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-userid');
                    const block = this.getAttribute('data-block') === 'true';
                    toggleUserBlock(userId, block);
                });
            });
            
            document.querySelectorAll('.edit-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const userId = this.getAttribute('data-userid');
                    editUser(userId);
                });
            });
        }, 100);
        
        console.log('✅ Users loaded:', allUsers.length);
    }).catch((error) => {
        console.error('❌ Error loading users:', error);
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
                <button class="action-btn edit-btn" data-userid="${user.id}">Edit</button>
                <button class="action-btn block-btn" data-userid="${user.id}" data-block="${!user.isBlocked}">
                    ${user.isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Re-attach event listeners
    setTimeout(() => {
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-userid');
                const block = this.getAttribute('data-block') === 'true';
                toggleUserBlock(userId, block);
            });
        });
    }, 100);
}

function loadUserDropdown() {
    console.log('📋 Loading user dropdown...');
    
    const select = document.getElementById('userSelect');
    if (!select) {
        console.error('❌ User select dropdown not found');
        return;
    }
    
    select.innerHTML = '<option value="">Select a user...</option>';
    
    allUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.email} (₹${(user.balance || 0).toFixed(2)})`;
        select.appendChild(option);
    });
    
    console.log('✅ User dropdown loaded');
}

function updateUserBalance() {
    console.log('💰 Updating user balance...');
    
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
        console.error('❌ Error updating balance:', error);
        alert('Error: ' + error.message);
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
        console.error('❌ Error updating user:', error);
        alert('Error updating user status.');
    });
}

function editUser(userId) {
    alert('Edit user functionality coming soon! User ID: ' + userId);
}

// Investment Plans Management
function loadPlans() {
    console.log('📈 Loading investment plans...');
    
    const plansRef = firebase.firestore().collection('investmentPlans');
    const plansList = document.getElementById('plansList');
    
    if (!plansList) {
        console.error('❌ Plans list container not found');
        return;
    }
    
    plansList.innerHTML = '<div style="text-align: center; padding: 20px;">Loading investment plans...</div>';
    
    plansRef.orderBy('isVIP', 'desc').orderBy('minAmount', 'asc').get().then((snapshot) => {
        if (snapshot.empty) {
            plansList.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <p>No investment plans found.</p>
                    <button class="submit-btn" id="createFirstPlan">Create First Plan</button>
                </div>
            `;
            
            document.getElementById('createFirstPlan').addEventListener('click', showAddPlanForm);
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
                        <button class="action-btn edit-btn" data-planid="${doc.id}">Edit</button>
                        <button class="action-btn ${plan.isActive ? 'block-btn' : 'edit-btn'}" data-planid="${doc.id}" data-status="${!plan.isActive}">
                            ${plan.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                    </div>
                </div>
            `;
            plansList.appendChild(planCard);
        });
        
        const addButton = document.createElement('div');
        addButton.style.marginTop = '20px';
        addButton.innerHTML = '<button class="submit-btn" id="addNewPlan">➕ Add New Investment Plan</button>';
        plansList.appendChild(addButton);
        
        // Add event listeners
        setTimeout(() => {
            document.getElementById('addNewPlan').addEventListener('click', showAddPlanForm);
            
            document.querySelectorAll('.edit-btn[data-planid]').forEach(btn => {
                btn.addEventListener('click', function() {
                    const planId = this.getAttribute('data-planid');
                    editPlan(planId);
                });
            });
            
            document.querySelectorAll('.block-btn[data-planid], .edit-btn[data-planid]').forEach(btn => {
                if (btn.classList.contains('block-btn') || btn.classList.contains('edit-btn')) {
                    btn.addEventListener('click', function() {
                        const planId = this.getAttribute('data-planid');
                        const newStatus = this.getAttribute('data-status') === 'true';
                        togglePlanStatus(planId, newStatus);
                    });
                }
            });
        }, 100);
        
    }).catch((error) => {
        console.error('❌ Error loading plans:', error);
        plansList.innerHTML = '<div style="text-align: center; color: red;">Error loading investment plans</div>';
    });
}

function showAddPlanForm() {
    console.log('➕ Showing add plan form...');
    
    const plansList = document.getElementById('plansList');
    plansList.innerHTML = `
        <div class="card">
            <h4>Create New Investment Plan</h4>
            <div class="form-group">
                <label>Plan Name</label>
                <input type="text" id="planName" placeholder="Enter plan name" class="form-control">
            </div>
            <div class="form-group">
                <label>Minimum Investment (₹)</label>
                <input type="number" id="planMinAmount" placeholder="1000" class="form-control" value="1000">
            </div>
            <div class="form-group">
                <label>Maximum Investment (₹)</label>
                <input type="number" id="planMaxAmount" placeholder="50000" class="form-control" value="50000">
            </div>
            <div class="form-group">
                <label>Daily Return (%)</label>
                <input type="number" id="planDailyReturn" placeholder="5.0" step="0.1" class="form-control" value="5.0">
            </div>
            <div class="form-group">
                <label>Plan Duration (days)</label>
                <input type="number" id="planDuration" placeholder="30" class="form-control" value="30">
            </div>
            <div class="form-group">
                <label>Total Return (%)</label>
                <input type="number" id="planTotalReturn" placeholder="150" readonly class="form-control" value="150">
            </div>
            <div class="form-group">
                <label>
                    <input type="checkbox" id="planIsVIP"> VIP Plan (Special benefits)
                </label>
            </div>
            <div class="form-group">
       
