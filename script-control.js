// System Control Panel JavaScript - FIXED REAL-TIME VERSION
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
    setupRealTimeListeners(); // NEW: Real-time data listeners
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
            if (tabName === 'payments') loadPaymentRequests();
        });
    });

    // Payment sub-tabs
    document.querySelectorAll('.payment-sub-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.payment-sub-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.payment-tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Content').classList.add('active');
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
        if (event.target == planModal) planModal.style.display = "none";
        if (event.target == document.getElementById('userDetailsModal')) {
            document.getElementById('userDetailsModal').style.display = "none";
        }
    };

    // User Details Modal Events
    setupUserDetailsModal();

    console.log('✅ All event listeners setup complete.');
}

// --- REAL-TIME DATA LISTENERS ---
function setupRealTimeListeners() {
    console.log('🔄 Setting up real-time listeners...');
    
    // Real-time users listener for dashboard updates
    firebase.firestore().collection('users')
        .onSnapshot(snapshot => {
            console.log('🔄 Users data updated - refreshing dashboard');
            loadDashboardStats();
        }, error => {
            console.error('❌ Real-time users listener error:', error);
        });
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
        
        // UPDATE THE UI IMMEDIATELY
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = userCount;
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        
        console.log('✅ Dashboard stats loaded - Users:', userCount, 'Balance: ₹', totalBalance);
    }).catch(error => {
        console.error('❌ Error loading dashboard stats:', error);
    });
}

function loadUsers() {
    console.log('👥 Loading users...');
    const usersRef = firebase.firestore().collection('users').orderBy('createdAt', 'desc');
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading users...</td></tr>';
    
    usersRef.get().then(snapshot => {
        allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsersTable();
        console.log(`✅ Loaded ${allUsers.length} users.`);
    }).catch(error => {
        console.error('❌ Error loading users:', error);
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Error loading users.</td></tr>';
    });
}

function renderUsersTable() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const usersToRender = searchTerm 
        ? allUsers.filter(user => (user.email && user.email.toLowerCase().includes(searchTerm)) || user.id.toLowerCase().includes(searchTerm)) 
        : allUsers;

    if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found.</td></tr>';
        return;
    }
    
    usersToRender.forEach(user => {
        const tr = document.createElement('tr');
        const joinDate = user.createdAt && user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        const isBlocked = user.isBlocked || false;
        
        tr.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td><a href="#" class="user-email-link" data-userid="${user.id}">${user.email || 'N/A'}</a></td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${joinDate}</td>
            <td>${isBlocked ? 'Blocked' : 'Active'}</td>
            <td>
                <button class="action-btn block-btn" data-userid="${user.id}" data-is-blocked="${isBlocked}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Add click events for user email links
    tbody.querySelectorAll('.user-email-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userid;
            showUserDetails(userId);
        });
    });
    
    // Re-attach listener for block buttons
    tbody.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userid;
            const isBlocked = this.dataset.isBlocked === 'true';
            toggleUserBlock(userId, !isBlocked);
        });
    });
}

function toggleUserBlock(userId, shouldBlock) {
    const action = shouldBlock ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;
    
    firebase.firestore().collection('users').doc(userId).update({
        isBlocked: shouldBlock
    }).then(() => {
        alert(`User ${action}ed successfully!`);
        loadUsers(); // Refresh users list
        loadDashboardStats(); // Refresh stats
    }).catch(error => console.error(`❌ Error ${action}ing user:`, error));
}

function loadUserDropdown() {
    console.log('📋 Loading user dropdown...');
    const select = document.getElementById('userSelect');
    select.innerHTML = '<option value="">Select a user...</option>';
    
    allUsers.sort((a, b) => a.email.localeCompare(b.email)).forEach(user => {
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
            const currentBalance = userData.balance || 0;
            let newBalance;
            let txAmount;
            let txType;

            if (action === 'add') {
                newBalance = currentBalance + amount;
                txAmount = amount; 
                txType = 'Admin Deposit';
            } else if (action === 'subtract') {
                newBalance = currentBalance - amount;
                if (newBalance < 0) throw new Error("Insufficient balance for this deduction.");
                txAmount = -amount; 
                txType = 'Admin Deduction';
            } else if (action === 'set') {
                newBalance = amount;
                txAmount = amount - currentBalance; 
                txType = 'Balance Adjustment';
            }

            transaction.update(userRef, { balance: newBalance });
            transaction.set(txRef, {
                userId: userId,
                userEmail: userData.email,
                type: txType, 
                amount: txAmount,
                details: reason || `Admin action: ${action}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                adminAction: true,
                processedBy: currentAdmin.email
            });
        });
    }).then(() => {
        alert('✅ Balance updated successfully!');
        // Clear form
        document.getElementById('balanceAmount').value = '';
        document.getElementById('balanceReason').value = '';
        
        // Refresh data IMMEDIATELY
        loadUsers();
        loadDashboardStats();
        loadUserDropdown();
    }).catch(error => {
        console.error('❌ Error updating balance:', error);
        alert('❌ Failed to update balance: ' + error.message);
    });
}

// --- PLAN MANAGEMENT FUNCTIONS (FIXED VERSION) ---
function loadPlans() {
    console.log('📈 Loading investment plans...');
    const plansContainer = document.getElementById('plansContainer');
    plansContainer.innerHTML = '<p>Loading plans...</p>';
    
    firebase.firestore().collection('investmentPlans')
        .orderBy('isVIP', 'desc')
        .orderBy('minAmount', 'asc')
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                plansContainer.innerHTML = '<p>No investment plans found. Click "Create New Plan" to add one.</p>';
                return;
            }
            
            plansContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const plan = { id: doc.id, ...doc.data() };
                const planCard = document.createElement('div');
                planCard.className = `plan-card ${plan.isVIP ? 'vip' : ''}`;
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
                        <div><strong>INVESTMENT</strong>₹${plan.minAmount?.toLocaleString() || '0'}</div>
                        <div><strong>DAILY RETURN</strong>${plan.dailyReturnPercent || plan.dailyReturn || '0'}%</div>
                        <div><strong>DURATION</strong>${plan.durationDays || plan.duration || '0'} Days</div>
                        <div><strong>TOTAL RETURN</strong>${plan.totalReturnPercent || plan.totalReturn || '0'}%</div>
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
        .catch(error => {
            console.error('❌ Error loading plans:', error);
            plansContainer.innerHTML = '<p style="color: red;">Error loading plans: ' + error.message + '</p>';
        });
}

function showPlanForm(planId = null) {
    const modal = document.getElementById('planModal');
    const title = document.getElementById('planModalTitle');
    const deleteBtn = document.getElementById('deletePlanBtn');
    
    if (planId) {
        // Edit mode
        title.textContent = 'Edit Plan';
        deleteBtn.style.display = 'inline-block';
        
        // Load plan data
        firebase.firestore().collection('investmentPlans').doc(planId).get()
            .then(doc => {
                if (doc.exists) {
                    const plan = doc.data();
                    document.getElementById('planId').value = planId;
                    document.getElementById('planName').value = plan.name || '';
                    document.getElementById('planMinAmount').value = plan.minAmount || '';
                    document.getElementById('planDuration').value = plan.durationDays || plan.duration || '';
                    document.getElementById('planDailyReturn').value = plan.dailyReturnPercent || plan.dailyReturn || '';
                    document.getElementById('planTotalReturn').value = plan.totalReturnPercent || plan.totalReturn || '';
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
    
    const planId = document.getElementById('planId').value;
    const planData = {
        name: document.getElementById('planName').value.trim(),
        minAmount: parseFloat(document.getElementById('planMinAmount').value),
        durationDays: parseInt(document.getElementById('planDuration').value),
        dailyReturnPercent: parseFloat(document.getElementById('planDailyReturn').value),
        totalReturnPercent: parseFloat(document.getElementById('planTotalReturn').value),
        isVIP: document.getElementById('planIsVIP').checked,
        isActive: true
    };
    
    // Validation
    if (!planData.name || !planData.minAmount || !planData.durationDays || !planData.dailyReturnPercent) {
        alert('Please fill all required fields');
        return;
    }
    
    let promise;
    if (planId) {
        // Update existing plan
        promise = firebase.firestore().collection('investmentPlans').doc(planId).update(planData);
    } else {
        // Create new plan
        planData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        promise = firebase.firestore().collection('investmentPlans').add(planData);
    }
    
    promise.then(() => {
        alert('✅ Plan saved successfully!');
        document.getElementById('planModal').style.display = 'none';
        loadPlans(); // Refresh plans list
    }).catch(error => {
        console.error('❌ Error saving plan:', error);
        alert('❌ Error saving plan: ' + error.message);
    });
}

function togglePlanStatus(planId, newStatus) {
    const action = newStatus ? 'activate' : 'deactivate';
    if (!confirm(`Are you sure you want to ${action} this plan?`)) return;
    
    firebase.firestore().collection('investmentPlans').doc(planId).update({
        isActive: newStatus
    }).then(() => {
        alert(`✅ Plan ${action}d successfully!`);
        loadPlans(); // Refresh plans list
    }).catch(error => {
        console.error(`❌ Error ${action}ing plan:`, error);
        alert('❌ Error: ' + error.message);
    });
}

function deletePlan(planId) {
    if (!confirm('⚠️ DANGER: Are you sure you want to permanently delete this plan? This cannot be undone.')) return;
    
    firebase.firestore().collection('investmentPlans').doc(planId).delete()
        .then(() => {
            alert('✅ Plan deleted successfully!');
            document.getElementById('planModal').style.display = 'none';
            loadPlans(); // Refresh plans list
        })
        .catch(error => {
            console.error('❌ Error deleting plan:', error);
            alert(
