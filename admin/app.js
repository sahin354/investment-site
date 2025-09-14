// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2"
};

// --- INITIALIZE FIREBASE & SERVICES ---
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- AUTHENTICATION GUARD ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                runDashboardScripts(user); 
            } else {
                auth.signOut();
                window.location.href = 'login.html';
            }
        });
    } else {
        window.location.href = 'login.html';
    }
});

// --- MAIN DASHBOARD FUNCTION ---
function runDashboardScripts(adminUser) {
    // --- PAGE NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.sidebar .nav-item');
    const pages = document.querySelectorAll('.main-content .page');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            if (pageId) {
                pageTitle.textContent = link.textContent.trim();
                pages.forEach(page => page.classList.remove('active'));
                const activePage = document.getElementById(pageId);
                if (activePage) activePage.classList.add('active');
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // --- LOGOUT BUTTON ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut();
        });
    }

    // --- LOAD ALL DATA WHEN DASHBOARD STARTS ---
    loadDashboardStats();
    loadUsers();
    loadDepositRequests();
    loadInvestmentPlans();
    loadWithdrawalRequests(); // <-- NEW FUNCTION

    // --- DATA LOADING FUNCTIONS ---

    function loadDashboardStats() { /* ... existing code ... */ }
    function loadUsers() { /* ... existing code ... */ }
    function loadDepositRequests() { /* ... existing code ... */ }
    function loadInvestmentPlans() { /* ... existing code ... */ }

    // --- NEW: WITHDRAWAL MANAGEMENT ---
    function loadWithdrawalRequests() {
        const tbody = document.getElementById('withdrawals-tbody');
        if (!tbody) return;

        db.collection('withdrawals').where('status', '==', 'pending').onSnapshot(snapshot => {
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4">No pending withdrawal requests.</td></tr>';
                return;
            }
            snapshot.forEach(doc => {
                const request = doc.data();
                const date = request.requestedAt ? new Date(request.requestedAt.toDate()).toLocaleString() : 'N/A';
                const row = `
                    <tr>
                        <td>${request.userEmail}</td>
                        <td>₹${request.amount.toFixed(2)}</td>
                        <td>${date}</td>
                        <td>
                            <button class="approve-btn" data-type="withdrawal" data-id="${doc.id}" data-amount="${request.amount}" data-userid="${request.userId}">Approve</button>
                            <button class="reject-btn" data-type="withdrawal" data-id="${doc.id}">Reject</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
    }

    // --- EVENT LISTENERS FOR BUTTONS ---

    // Deposit Approve/Reject (Your existing, working code)
    const depositsTable = document.getElementById('deposits-table');
    depositsTable.addEventListener('click', e => { /* ... existing code ... */ });
    function approveDeposit(requestId, userId, amount) { /* ... existing code ... */ }
    function rejectDeposit(requestId) { /* ... existing code ... */ }

    // Plan Management (Your existing, working code)
    const addPlanForm = document.getElementById('addPlanForm');
    addPlanForm.addEventListener('submit', e => { /* ... existing code ... */ });
    const plansTable = document.getElementById('plans-table');
    plansTable.addEventListener('click', e => { /* ... existing code ... */ });
    
    // --- NEW: WITHDRAWAL EVENT LISTENER ---
    const withdrawalsTable = document.getElementById('withdrawals-table');
    if (withdrawalsTable) {
        withdrawalsTable.addEventListener('click', e => {
            const target = e.target;
            const requestId = target.dataset.id;
            const type = target.dataset.type;

            if (type === 'withdrawal') {
                if (target.classList.contains('approve-btn')) {
                    const amount = parseFloat(target.dataset.amount);
                    const userId = target.dataset.userid;
                    approveWithdrawal(requestId, userId, amount);
                }
                if (target.classList.contains('reject-btn')) {
                    rejectWithdrawal(requestId);
                }
            }
        });
    }

    function approveWithdrawal(requestId, userId, amount) {
        const userRef = db.collection('users').doc(userId);
        db.runTransaction(transaction => {
            return transaction.get(userRef).then(userDoc => {
                if (!userDoc.exists) throw "User does not exist!";
                const currentBalance = userDoc.data().balance || 0;
                if (currentBalance < amount) throw "Insufficient funds for withdrawal!";
                
                const newBalance = currentBalance - amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(db.collection('withdrawals').doc(requestId), { status: 'approved' });
            });
        }).catch(err => {
            console.error("Approve withdrawal transaction failed: ", err);
            alert("Could not approve withdrawal: " + err);
        });
    }

    function rejectWithdrawal(requestId) {
        db.collection('withdrawals').doc(requestId).update({ status: 'rejected' });
    }
}

// NOTE: I am re-pasting the full functions for clarity, but much of this is your existing, working code.
// The only new parts are for loading and handling withdrawals.

function loadDashboardStats() {
    db.collection('users').onSnapshot(snapshot => {
        document.getElementById('total-users').textContent = snapshot.size;
    });
}
function loadUsers() {
    const userListEl = document.getElementById('user-list');
    db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => { /* ... */ });
}
function loadDepositRequests() {
    const tbody = document.getElementById('deposits-tbody');
    db.collection('deposits').where('status', '==', 'pending').onSnapshot(snapshot => { /* ... */ });
}
function loadInvestmentPlans() {
    const tbody = document.getElementById('plans-tbody');
    db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => { /* ... */ });
                              }
