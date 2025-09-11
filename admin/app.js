document.addEventListener('DOMContentLoaded', () => {

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

    // --- INITIALIZE FIREBASE ---
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const auth = firebase.auth();
    const db = firebase.firestore();


    // --- AUTHENTICATION CHECK ---
    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("Admin is logged in.");
            loadDashboardStats();
            loadPendingDeposits();
        } else {
            console.log("Admin is not logged in. Redirecting...");
            window.location.href = 'login.html';
        }
    });


    // --- NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('.sidebar a');
    const pages = document.querySelectorAll('.main-content .page');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = e.target.dataset.page;
            if (!pageId) return; // Ignore if it's not a page link (like logout)

            pageTitle.textContent = e.target.textContent;
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
            pages.forEach(p => p.classList.remove('active'));
            document.getElementById(pageId).classList.add('active');
        });
    });
    
    // --- LOGOUT BUTTON ---
     const logoutBtn = document.getElementById('logoutBtn');
     if(logoutBtn) {
         logoutBtn.addEventListener('click', () => {
             auth.signOut();
         });
     }


    // --- LOAD DASHBOARD STATS ---
    function loadDashboardStats() {
        const totalUsersEl = document.getElementById('total-users');
        db.collection('users').onSnapshot(snapshot => {
            totalUsersEl.textContent = snapshot.size;
        });
    }


    // --- LOAD PENDING DEPOSITS ---
    function loadPendingDeposits() {
        const depositsTableBody = document.getElementById('depositsTbody');
        
        db.collection('deposits').where('status', '==', 'pending').orderBy('timestamp', 'desc')
            .onSnapshot(async (snapshot) => {
                if(snapshot.empty) {
                    depositsTableBody.innerHTML = '<tr><td colspan="4">No pending requests found.</td></tr>';
                    return;
                }
                
                depositsTableBody.innerHTML = '';
                
                for (const doc of snapshot.docs) {
                    const deposit = doc.data();
                    let userEmail = 'Unknown User';
                    
                    try {
                        const userDoc = await db.collection('users').doc(deposit.userId).get();
                        if (userDoc.exists) {
                            userEmail = userDoc.data().email;
                        }
                    } catch (error) {
                        console.error("Error fetching user email:", error);
                    }

                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${userEmail}</td>
                        <td>₹${deposit.amount.toFixed(2)}</td>
                        <td>${new Date(deposit.timestamp.toDate()).toLocaleString()}</td>
                        <td>
                            <button class="approve-btn" data-id="${doc.id}" data-user="${deposit.userId}" data-amount="${deposit.amount}">Approve</button>
                            <button class="reject-btn" data-id="${doc.id}">Reject</button>
                        </td>
                    `;
                    depositsTableBody.appendChild(row);
                }
                addEventListenersToButtons();
            });
    }

    // --- ADD EVENT LISTENERS FOR APPROVE/REJECT ---
    function addEventListenersToButtons() {
        document.querySelectorAll('.approve-btn').forEach(button => {
            button.onclick = (e) => {
                const depositId = e.target.dataset.id;
                const userId = e.target.dataset.user;
                const amount = parseFloat(e.target.dataset.amount);
                approveDeposit(depositId, userId, amount);
            };
        });

        document.querySelectorAll('.reject-btn').forEach(button => {
            button.onclick = (e) => {
                const depositId = e.target.dataset.id;
                rejectDeposit(depositId);
            };
        });
    }

    // --- APPROVE/REJECT LOGIC ---
    async function approveDeposit(depositId, userId, amount) {
        if (!confirm('Are you sure you want to approve this deposit?')) return;

        const depositRef = db.collection('deposits').doc(depositId);
        const userRef = db.collection('users').doc(userId);

        try {
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) throw "User document does not exist!";
                
                const newBalance = (userDoc.data().balance || 0) + amount;
                transaction.update(userRef, { balance: newBalance });
                transaction.update(depositRef, { status: 'approved' });
            });
            console.log('Deposit approved!');
        } catch (error) {
            console.error("Transaction failed: ", error);
            alert("Failed to approve deposit.");
        }
    }

    async function rejectDeposit(depositId) {
        if (!confirm('Are you sure you want to reject this deposit?')) return;
        
        try {
            await db.collection('deposits').doc(depositId).update({ status: 'rejected' });
            console.log('Deposit rejected.');
        } catch (error) {
            console.error("Error rejecting deposit: ", error);
        }
    }

});
