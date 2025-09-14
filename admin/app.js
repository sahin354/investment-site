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
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- AUTHENTICATION GUARD ---
auth.onAuthStateChanged(user => {
    if (user) {
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                runDashboardScripts(); 
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
function runDashboardScripts() {
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
                document.getElementById(pageId)?.classList.add('active');
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // --- LOGOUT BUTTON ---
    document.getElementById('logoutBtn')?.addEventListener('click', () => auth.signOut());

    // --- LOAD ALL DATA ---
    loadDashboardStats();
    loadUsers();
    loadDepositRequests();
    loadWithdrawalRequests();
    loadInvestmentPlans();

    // --- DATA LOADING FUNCTIONS ---
    function loadDashboardStats() {
        db.collection('users').onSnapshot(snap => {
            document.getElementById('total-users').textContent = snap.size;
        });
        db.collection('deposits').where('status', '==', 'pending').onSnapshot(snap => {
            document.getElementById('pending-deposits').textContent = snap.size;
        });
        db.collection('withdrawals').where('status', '==', 'pending').onSnapshot(snap => {
            document.getElementById('pending-withdrawals').textContent = snap.size;
        });
    }

    function loadUsers() {
        const userListEl = document.getElementById('user-list');
        db.collection('users').orderBy('createdAt', 'desc').onSnapshot(snapshot => {
            let html = '<table><thead><tr><th>Full Name</th><th>Email</th><th>Phone</th><th>Balance</th><th>Role</th></tr></thead><tbody>';
            snapshot.forEach(doc => {
                const user = doc.data();
                html += `<tr>
                    <td>${user.fullName}</td><td>${user.email}</td><td>${user.phone}</td>
                    <td>₹${user.balance?.toFixed(2) || '0.00'}</td><td>${user.role}</td>
                </tr>`;
            });
                            // This is the new row with the Manage button
                html += `<tr>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>₹${user.balance?.toFixed(2) || '0.00'}</td>
                    <td>${user.role}</td>
                    <td>
                        <button class="manage-btn" data-userid="${doc.id}" data-username="${user.fullName}">Manage</button>
                    </td>
                </tr>`;
        });
    }

    function loadDepositRequests() {
        const tbody = document.getElementById('deposits-tbody');
        db.collection('deposits').where('status', '==', 'pending').onSnapshot(snapshot => {
            tbody.innerHTML = snapshot.empty ? '<tr><td colspan="4">No pending requests.</td></tr>' : '';
            snapshot.forEach(doc => {
                const req = doc.data();
                tbody.innerHTML += `<tr>
                    <td>${req.userEmail}</td><td>₹${req.amount.toFixed(2)}</td>
                    <td>${new Date(req.requestedAt.toDate()).toLocaleString()}</td>
                    <td>
                        <button class="approve-btn" data-type="deposit" data-id="${doc.id}" data-amount="${req.amount}" data-userid="${req.userId}">Approve</button>
                        <button class="reject-btn" data-type="deposit" data-id="${doc.id}">Reject</button>
                    </td>
                </tr>`;
            });
        });
    }

    function loadWithdrawalRequests() {
        const tbody = document.getElementById('withdrawals-tbody');
        db.collection('withdrawals').where('status', '==', 'pending').onSnapshot(snapshot => {
            tbody.innerHTML = snapshot.empty ? '<tr><td colspan="4">No pending requests.</td></tr>' : '';
            snapshot.forEach(doc => {
                const req = doc.data();
                tbody.innerHTML += `<tr>
                    <td>${req.userEmail}</td><td>₹${req.amount.toFixed(2)}</td>
                    <td>${new Date(req.requestedAt.toDate()).toLocaleString()}</td>
                    <td>
                        <button class="approve-btn" data-type="withdrawal" data-id="${doc.id}" data-amount="${req.amount}" data-userid="${req.userId}">Approve</button>
                        <button class="reject-btn" data-type="withdrawal" data-id="${doc.id}">Reject</button>
                    </td>
                </tr>`;
            });
        });
    }

    function loadInvestmentPlans() {
        const tbody = document.getElementById('plans-tbody');
        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            tbody.innerHTML = snapshot.empty ? '<tr><td colspan="5">No plans created yet.</td></tr>' : '';
            snapshot.forEach(doc => {
                const plan = doc.data();
                tbody.innerHTML += `<tr>
                    <td>${plan.planName}</td><td>₹${plan.investPrice}</td><td>₹${plan.dayIncome}</td><td>${plan.incomeDays}</td>
                    <td><button class="delete-btn" data-id="${doc.id}">Delete</button></td>
                </tr>`;
            });
        });
    }

    // --- EVENT LISTENERS FOR ACTIONS ---
    document.querySelector('.content-area').addEventListener('click', e => {
        const { type, id, amount, userid } = e.target.dataset;
        if (!type || !id) return;
        const amountNum = parseFloat(amount);
        if (e.target.classList.contains('approve-btn')) {
            if (type === 'deposit') approveDeposit(id, userid, amountNum);
            if (type === 'withdrawal') approveWithdrawal(id, userid, amountNum);
        }
        if (e.target.classList.contains('reject-btn')) {
            rejectTransaction((type === 'deposit' ? 'deposits' : 'withdrawals'), id);
        }
        if (e.target.classList.contains('delete-btn')) {
            if (confirm('Are you sure?')) db.collection('plans').doc(id).delete();
        }
    });

    document.getElementById('addPlanForm').addEventListener('submit', e => {
        e.preventDefault();
        db.collection('plans').add({
            planName: e.target.planName.value,
            investPrice: parseFloat(e.target.investPrice.value),
            dayIncome: parseFloat(e.target.dayIncome.value),
            incomeDays: parseInt(e.target.incomeDays.value)
        }).then(() => e.target.reset());
    });

    // --- TRANSACTION LOGIC ---
    function approveDeposit(reqId, userId, amount) {
        const userRef = db.collection('users').doc(userId);
        db.runTransaction(async t => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw "User not found!";
            const newBalance = (userDoc.data().balance || 0) + amount;
            t.update(userRef, { balance: newBalance });
            t.update(db.collection('deposits').doc(reqId), { status: 'approved' });
        }).catch(err => console.error("Approve deposit failed:", err));
    }
    
    function approveWithdrawal(reqId, userId, amount) {
        const userRef = db.collection('users').doc(userId);
        db.runTransaction(async t => {
            const userDoc = await t.get(userRef);
            if (!userDoc.exists) throw "User not found!";
            const currentBalance = userDoc.data().balance || 0;
            if (currentBalance < amount) throw "Insufficient funds!";
            const newBalance = currentBalance - amount;
            t.update(userRef, { balance: newBalance });
            t.update(db.collection('withdrawals').doc(reqId), { status: 'approved' });
        }).catch(err => alert("Withdrawal failed: " + err));
    }

    function rejectTransaction(collection, reqId) {
        db.collection(collection).doc(reqId).update({ status: 'rejected' });
    }
                                    }
