// System Control Panel JavaScript
let allUsers = [];
let currentAdmin = null;

// Pre-defined system administrators
const SYSTEM_ADMINS = [
    "sahin54481@gmail.com",
    "adminadani.com"
];

// Check system administrator access
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // Check if user is system administrator
        if (SYSTEM_ADMINS.includes(user.email)) {
            currentAdmin = user;
            initializeControlPanel();
        } else {
            alert('Unauthorized access attempt detected.');
            firebase.auth().signOut();
            window.location.href = 'login.html';
        }
    } else {
        // Redirect to system login
        window.location.href = 'system-control.html';
    }
});

function initializeControlPanel() {
    console.log('Control panel initialized for:', currentAdmin.email);
    loadDashboardStats();
    loadUsers();
    setupEventListeners();
}

function setupEventListeners() {
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

// Add all the other functions from script-admin.js (loadUserDropdown, updateUserBalance, etc.)
// Copy all the remaining functions from your existing script-admin.js file here

function logoutControl() {
    if (confirm('Are you sure you want to securely logout?')) {
        firebase.auth().signOut().then(() => {
            window.location.href = 'system-control.html';
        });
    }
}

// Add status badges CSS
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

// COPY ALL REMAINING FUNCTIONS FROM YOUR EXISTING script-admin.js FILE
// Functions to copy: loadUserDropdown, updateUserBalance, toggleUserBlock, deleteUser, 
// loadPlans, showAddPlanForm, saveNewPlan, saveSystemSettings, etc.
