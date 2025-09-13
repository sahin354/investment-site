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
        // Check if user is an admin
        db.collection('users').doc(user.uid).get().then(doc => {
            if (doc.exists && doc.data().role === 'admin') {
                console.log("Admin verified. Loading dashboard...");
                runDashboardScripts(); // Run main scripts if admin
            } else {
                console.log("User is not an admin. Redirecting...");
                auth.signOut();
                window.location.href = 'login.html';
            }
        });
    } else {
        console.log("No user logged in. Redirecting...");
        window.location.href = 'login.html';
    }
});

// --- MAIN DASHBOARD FUNCTION ---
function runDashboardScripts() {
    // --- PAGE NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.sidebar a');
    const pages = document.querySelectorAll('.page');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');

            if (pageId) {
                // Update title and page visibility
                pageTitle.textContent = link.textContent;
                pages.forEach(page => page.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');

                // Update active link style
                navLinks.forEach(nav => nav.classList.remove('active'));
                link.classList.add('active');
            }
        });
    });
    
    // --- LOGOUT BUTTON ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut();
        });
    }

    // --- LOAD INITIAL DATA ---
    loadDashboardStats();
    loadUsers();
    loadDepositRequests();
    loadInvestmentPlans(); // <-- NEW: Load plans when dashboard loads

    // --- DASHBOARD STATS ---
    function loadDashboardStats() {
        const totalUsersEl = document.getElementById('total-users');
        db.collection('users').onSnapshot(snapshot => {
            totalUsersEl.textContent = snapshot.size;
        });
        // Add more stats loading here (recharge, etc.)
    }

    // --- USER MANAGEMENT ---
    function loadUsers() {
        const userListEl = document.getElementById('user-list');
        db.collection('users').onSnapshot(snapshot => {
            let html = '<table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Balance</th><th>Role</th></tr></thead><tbody>';
            snapshot.forEach(doc => {
                const user = doc.data();
                html += `<tr>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td>₹${user.balance.toFixed(2)}</td>
                    <td>${user.role}</td>
                </tr>`;
            });
            html += '</tbody></table>';
            userListEl.innerHTML = html;
        });
    }

    // --- DEPOSIT REQUESTS ---
    function loadDepositRequests() {
        const tbody = document.getElementById('deposits-tbody');
        db.collection('deposits').where('status', '==', 'pending').onSnapshot(snapshot => {
            tbody.innerHTML = '';
            if (snapshot.empty) {
                tbody.innerHTML = '<tr><td colspan="4">No pending requests.</td></tr>';
            }
            snapshot.forEach(doc => {
                const request = doc.data();
                const row = `
                    <tr>
                        <td>${request.userEmail}</td>
                        <td>₹${request.amount.toFixed(2)}</td>
                        <td>${new Date(request.requestedAt.toDate()).toLocaleString()}</td>
                        <td>
                            <button class="approve-btn" data-id="${doc.id}" data-amount="${request.amount}" data-userid="${request.userId}">Approve</button>
                            <button class="reject-btn" data-id="${doc.id}">Reject</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
    }

    const depositsTable = document.getElementById('deposits-table');
    depositsTable.addEventListener('click', (e) => {
        const target = e.target;
        const requestId = target.getAttribute('data-id');
        if (target.classList.contains('approve-btn')) {
            const amount = parseFloat(target.getAttribute('data-amount'));
            const userId = target.getAttribute('data-userid');
            approveDeposit(requestId, userId, amount);
        }
        if (target.classList.contains('reject-btn')) {
            rejectDeposit(requestId);
        }
    });

    function approveDeposit(requestId, userId, amount) {
        const depositRef = db.collection('deposits').doc(requestId);
        const userRef = db.collection('users').doc(userId);
        db.runTransaction(transaction => {
            return transaction.get(userRef).then(userDoc => {
                if (!userDoc.exists) throw "User does not exist!";
                const newBalance = userDoc.data().balance + amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(depositRef, { status: 'approved' });
            });
        }).catch(err => console.error("Approve transaction failed: ", err));
    }

    function rejectDeposit(requestId) {
        db.collection('deposits').doc(requestId).update({ status: 'rejected' });
    }

    // --- NEW: INVESTMENT PLAN MANAGEMENT ---
    function loadInvestmentPlans() {
        const tbody = document.getElementById('plans-tbody');
        if (!tbody) return;

        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            tbody.innerHTML = ''; // Clear table before adding new data
            snapshot.forEach(doc => {
                const plan = doc.data();
                const row = `
                    <tr>
                        <td>${plan.planName}</td>
                        <td>₹${plan.investPrice}</td>
                        <td>₹${plan.dayIncome}</td>
                        <td>${plan.incomeDays}</td>
                        <td>
                            <button class="delete-btn" data-id="${doc.id}">Delete</button>
                        </td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
        });
    }

    // Handle adding a new plan
    const addPlanForm = document.getElementById('addPlanForm');
    if (addPlanForm) {
        addPlanForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const planName = addPlanForm.planName.value;
            const investPrice = parseFloat(addPlanForm.investPrice.value);
            const dayIncome = parseFloat(addPlanForm.dayIncome.value);
            const incomeDays = parseInt(addPlanForm.incomeDays.value);

            db.collection('plans').add({
                planName,
                investPrice,
                dayIncome,
                incomeDays
            }).then(() => {
                console.log("Plan added successfully");
                addPlanForm.reset();
            }).catch(error => {
                console.error("Error adding plan: ", error);
                alert("Could not add plan. See console for details.");
            });
        });
    }

    // Handle deleting a plan
    const plansTable = document.getElementById('plans-table');
    if (plansTable) {
        plansTable.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const planId = e.target.getAttribute('data-id');
                if (confirm('Are you sure you want to delete this plan?')) {
                    db.collection('plans').doc(planId).delete()
                        .then(() => console.log("Plan deleted successfully"))
                        .catch(error => console.error("Error deleting plan: ", error));
                }
            }
        });
    }
              }
