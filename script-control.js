// System Control Panel JavaScript - COMPLETE & FIXED
console.log('🔧 Admin panel script loading...');

// --- GLOBAL VARIABLES ---
let allUsers = [];      // Cache for all user data to enable searching
let currentAdmin = null; // Store the currently logged-in admin user object

// Pre-defined system administrators (emails must be lowercase)
const SYSTEM_ADMINS = [
    "sahin54481@gmail.com",
    "admin@adani.com"
];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', function() {
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
    firebase.auth().onAuthStateChanged(function(user) {
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
    }, function(error) {
        console.error('❌ Auth state error:', error);
        alert('Authentication error. Please try again.');
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
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            console.log('📑 Tab clicked:', tabName);
            document.querySelectorAll('.control-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');
            if (tabName === 'balance') loadUserDropdown();
            if (tabName === 'plans') loadPlans();
        });
    });
    document.getElementById('logoutButton').addEventListener('click', logoutControl);
    document.getElementById('updateBalanceButton').addEventListener('click', updateUserBalance);
    document.getElementById('saveSettingsButton').addEventListener('click', saveSystemSettings);
    document.getElementById('searchUser').addEventListener('input', renderUsersTable);
    console.log('✅ All event listeners setup complete.');
}

// --- DATA LOADING & RENDERING ---
function loadDashboardStats() {
    console.log('📊 Loading dashboard stats...');
    const usersRef = firebase.firestore().collection('users');
    usersRef.get().then(snapshot => {
        const userCount = snapshot.size;
        let totalBalance = 0;
        snapshot.forEach(doc => {
            totalBalance += doc.data().balance || 0;
        });
        document.getElementById('totalUsers').textContent = userCount;
        document.getElementById('activeUsers').textContent = userCount;
        document.getElementById('totalBalance').textContent = '₹' + totalBalance.toLocaleString();
        console.log('✅ Dashboard stats loaded.');
    }).catch(error => console.error('❌ Error loading dashboard stats:', error));
}

function loadUsers() {
    console.log('👥 Loading users...');
    const usersRef = firebase.firestore().collection('users').orderBy('createdAt', 'desc');
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';

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
            <td>${user.email || 'N/A'}</td>
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

    tbody.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userid;
            const isBlocked = this.dataset.isBlocked === 'true';
            toggleUserBlock(userId, !isBlocked);
        });
    });
}

// --- FUNCTIONALITIES ---
function toggleUserBlock(userId, shouldBlock) {
    const action = shouldBlock ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    firebase.firestore().collection('users').doc(userId).update({ isBlocked: shouldBlock })
        .then(() => {
            alert(`User ${action}ed successfully!`);
            loadUsers();
        })
        .catch(error => console.error(`❌ Error ${action}ing user:`, error));
}

function loadUserDropdown() {
    console.log('📋 Loading user dropdown for balance changes...');
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
    
    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid positive amount.');
        return;
    }

    const userRef = firebase.firestore().collection('users').doc(userId);
    firebase.firestore().runTransaction(transaction => {
        return transaction.get(userRef).then(userDoc => {
            if (!userDoc.exists) throw new Error("User not found!");
            const currentBalance = userDoc.data().balance || 0;
            let newBalance;
            if (action === 'add') newBalance = currentBalance + amount;
            else if (action === 'subtract') newBalance = currentBalance - amount;
            else if (action === 'set') newBalance = amount;
            if (newBalance < 0) throw new Error("Balance cannot be negative.");
            transaction.update(userRef, { balance: newBalance });
        });
    }).then(() => {
        alert('Balance updated successfully!');
        loadUsers();
        loadDashboardStats();
    }).catch(error => {
        console.error('❌ Error updating balance:', error);
        alert('Failed to update balance: ' + error.message);
    });
}

function saveSystemSettings() {
    console.log('💾 Saving system settings...');
    const settings = {
        commission1: parseFloat(document.getElementById('commission1').value),
        commission2: parseFloat(document.getElementById('commission2').value),
        commission3: parseFloat(document.getElementById('commission3').value),
        minWithdrawal: parseFloat(document.getElementById('minWithdrawal').value),
        maxWithdrawal: parseFloat(document.getElementById('maxWithdrawal').value)
    };
    firebase.firestore().collection('systemSettings').doc('config').set(settings, { merge: true })
        .then(() => alert('✅ System settings saved successfully!'))
        .catch(error => {
            console.error('❌ Error saving settings:', error);
            alert('Error saving settings.');
        });
}

function logoutControl() {
    console.log('🔒 Logging out...');
    if (confirm('Are you sure you want to secure logout?')) {
        firebase.auth().signOut()
            .then(() => window.location.href = 'system-control.html')
            .catch(error => console.error('❌ Logout error:', error));
    }
}

function loadPlans() {
    console.log('📈 Loading investment plans...');
    document.getElementById('plansList').innerHTML = '<p>Plan management UI is not yet implemented.</p>';
}
