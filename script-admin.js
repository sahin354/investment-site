// Admin Panel JavaScript
let allUsers = [];
let currentAdmin = null;

// Check admin authentication
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // Check if user is admin
        checkAdminStatus(user);
    } else {
        // Redirect to login if not authenticated
        window.location.href = 'admin-login.html';
    }
});

function checkAdminStatus(user) {
    const adminDoc = firebase.firestore().collection('admins').doc(user.uid);
    
    adminDoc.get().then((doc) => {
        if (doc.exists) {
            currentAdmin = user;
            initializeAdminPanel();
        } else {
            alert('Access denied. Admin privileges required.');
            firebase.auth().signOut();
            window.location.href = 'admin-login.html';
        }
    }).catch((error) => {
        console.error('Admin check error:', error);
        alert('Error verifying admin access.');
    });
}

function initializeAdminPanel() {
    console.log('Admin panel initialized for:', currentAdmin.email);
    loadDashboardStats();
    loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
    // Tab switching
    const tabs = document.querySelectorAll('.admin-tab');
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
}

function loadDashboardStats() {
    const usersRef = firebase.firestore().collection('users');
    
    // Total users count
    usersRef.get().then((snapshot) => {
        document.getElementById('totalUsers').textContent = snapshot.size;
        document.getElementById('activeUsers').textContent = snapshot.size;
        
        // Calculate total balance
        let totalBalance = 0;
        snapshot.forEach(doc => {
            const userData = doc.data();
            totalBalance += userData.balance || 0;
        });
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
    });
    
    // Today's revenue (you need to implement this based on your transaction system)
    document.getElementById('todayRevenue').textContent = '₹0';
}

function loadUsers() {
    const usersRef = firebase.firestore().collection('users');
    const tbody = document.getElementById('usersTableBody');
    
    usersRef.orderBy('createdAt', 'desc').get().then((snapshot) => {
        allUsers = [];
        tbody.innerHTML = '';
        
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
                    <button class="action-btn delete-btn" onclick="deleteUser('${doc.id}')">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

function searchUsers() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    
    tbody.innerHTML = '';
    
    const filteredUsers = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.id.toLowerCase().includes(searchTerm)
    );
    
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
                <button class="action-btn delete-btn" onclick="deleteUser('${user.id}')">Delete</button>
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
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid amount.');
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
            
            // Update balance
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
        }
    }).then(() => {
        alert('Balance updated successfully!');
        document.getElementById('balanceAmount').value = '';
        document.getElementById('balanceReason').value = '';
        loadUsers(); // Refresh users list
        loadDashboardStats(); // Refresh stats
    }).catch((error) => {
        console.error('Error updating balance:', error);
        alert('Error updating balance. Please try again.');
    });
}

function toggleUserBlock(userId, block) {
    if (!confirm(`Are you sure you want to ${block ? 'block' : 'unblock'} this user?`)) {
        return;
    }
    
    firebase.firestore().collection('users').doc(userId).update({
        isBlocked: block,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert(`User ${block ? 'blocked' : 'unblocked'} successfully!`);
        loadUsers();
    }).catch((error) => {
        console.error('Error updating user:', error);
        alert('Error updating user status.');
    });
}

function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        return;
    }
    
    firebase.firestore().collection('users').doc(userId).delete().then(() => {
        alert('User deleted successfully!');
        loadUsers();
        loadDashboardStats();
    }).catch((error) => {
        console.error('Error deleting user:', error);
        alert('Error deleting user.');
    });
}

function loadPlans() {
    const plansRef = firebase.firestore().collection('investmentPlans');
    const plansList = document.getElementById('plansList');
    
    plansList.innerHTML = '<p>Loading plans...</p>';
    
    plansRef.get().then((snapshot) => {
        if (snapshot.empty) {
            plansList.innerHTML = '<p>No investment plans found.</p>';
            return;
        }
        
        plansList.innerHTML = '';
        snapshot.forEach(doc => {
            const plan = doc.data();
            const planCard = document.createElement('div');
            planCard.className = 'card';
            planCard.innerHTML = `
                <h4>${plan.name}</h4>
                <p>Investment: ₹${plan.minAmount} - ₹${plan.maxAmount}</p>
                <p>Daily Return: ${plan.dailyReturn}%</p>
                <p>Duration: ${plan.duration} days</p>
                <p>Status: ${plan.isActive ? 'Active' : 'Inactive'}</p>
                <div class="admin-actions">
                    <button class="action-btn edit-btn" onclick="editPlan('${doc.id}')">Edit</button>
                    <button class="action-btn ${plan.isActive ? 'block-btn' : 'edit-btn'}" onclick="togglePlanStatus('${doc.id}', ${!plan.isActive})">
                        ${plan.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="action-btn delete-btn" onclick="deletePlan('${doc.id}')">Delete</button>
                </div>
            `;
            plansList.appendChild(planCard);
        });
    });
}

function showAddPlanForm() {
    const planForm = `
        <div class="card">
            <h4>Add New Investment Plan</h4>
            <div class="form-group">
                <label>Plan Name</label>
                <input type="text" id="planName" placeholder="Enter plan name">
            </div>
            <div class="form-group">
                <label>Minimum Amount (₹)</label>
                <input type="number" id="planMinAmount" placeholder="Minimum investment">
            </div>
            <div class="form-group">
                <label>Maximum Amount (₹)</label>
                <input type="number" id="planMaxAmount" placeholder="Maximum investment">
            </div>
            <div class="form-group">
                <label>Daily Return (%)</label>
                <input type="number" id="planDailyReturn" placeholder="Daily return percentage" step="0.01">
            </div>
            <div class="form-group">
                <label>Duration (days)</label>
                <input type="number" id="planDuration" placeholder="Plan duration in days">
            </div>
            <div class="admin-actions">
                <button class="submit-btn" onclick="saveNewPlan()">Save Plan</button>
                <button class="action-btn block-btn" onclick="cancelAddPlan()">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('plansList').innerHTML = planForm + document.getElementById('plansList').innerHTML;
}

function saveNewPlan() {
    const planData = {
        name: document.getElementById('planName').value,
        minAmount: parseFloat(document.getElementById('planMinAmount').value),
        maxAmount: parseFloat(document.getElementById('planMaxAmount').value),
        dailyReturn: parseFloat(document.getElementById('planDailyReturn').value),
        duration: parseInt(document.getElementById('planDuration').value),
        isActive: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Validation
    if (!planData.name || !planData.minAmount || !planData.maxAmount || !planData.dailyReturn || !planData.duration) {
        alert('Please fill all fields.');
        return;
    }
    
    firebase.firestore().collection('investmentPlans').add(planData).then(() => {
        alert('Plan added successfully!');
        loadPlans();
    }).catch((error) => {
        console.error('Error adding plan:', error);
        alert('Error adding plan.');
    });
}

function saveSystemSettings() {
    const settings = {
        commission1: parseInt(document.getElementById('commission1').value),
        commission2: parseInt(document.getElementById('commission2').value),
        commission3: parseInt(document.getElementById('commission3').value),
        minWithdrawal: parseInt(document.getElementById('minWithdrawal').value),
        maxWithdrawal: parseInt(document.getElementById('maxWithdrawal').value),
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    firebase.firestore().collection('systemSettings').doc('commissionRates').set(settings)
    .then(() => {
        alert('Settings saved successfully!');
    })
    .catch((error) => {
        console.error('Error saving settings:', error);
        alert('Error saving settings.');
    });
}

function logoutAdmin() {
    if (confirm('Are you sure you want to logout?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = 'admin-login.html';
        });
    }
}

// Add some CSS for status badges
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
    .status-badge.blocked {
        background: #f8d7da;
        color: #721c24;
    }
`;
document.head.appendChild(style);
