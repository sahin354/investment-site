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

// --- THE ROBUST AUTHENTICATION GUARD ---
auth.onAuthStateChanged(user => {
    const isProtectedPage = !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html');
    if (user) {
        console.log('User is logged in. Running page scripts.');
        runPageSpecificScripts(user);
    } else {
        if (isProtectedPage) {
            console.log('User is not logged in. Redirecting to login.');
            window.location.href = 'login.html';
        }
    }
});

// This function holds all the logic that should ONLY run when a user is logged in.
function runPageSpecificScripts(user) {
    // --- SIDEBAR MENU LOGIC (for index.html) ---
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
        closeBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }

    // --- LOGOUT LOGIC (Handles all logout buttons) ---
    const handleLogout = (event) => {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut();
        }
    };
    document.getElementById('logoutBtnSidebar')?.addEventListener('click', handleLogout);
    document.getElementById('logoutBtnMine')?.addEventListener('click', handleLogout);
    
    // --- MINE PAGE: DISPLAY USER DATA ---
    if (document.getElementById('user-name-phone')) {
        db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('user-name-phone').textContent = `${userData.fullName} (${userData.phone})`;
                document.getElementById('user-email').textContent = userData.email;
                document.getElementById('user-balance').textContent = `₹ ${userData.balance.toFixed(2)}`;
            }
        });
    }

    // --- MINE PAGE: SUBMIT WITHDRAWAL REQUEST ---
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        const messageEl = document.getElementById('withdrawal-message');
        withdrawalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(withdrawalForm.withdrawAmount.value);
            const currentBalance = parseFloat(document.getElementById('user-balance').textContent.replace('₹', '').trim());

            if (isNaN(amount) || amount <= 0) {
                messageEl.textContent = 'Please enter a valid amount.';
                return;
            }
            if (amount > currentBalance) {
                messageEl.textContent = 'Withdrawal amount cannot exceed your balance.';
                return;
            }

            db.collection('withdrawals').add({
                userId: user.uid, userEmail: user.email, amount: amount, status: 'pending',
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                messageEl.textContent = 'Withdrawal request submitted!';
                withdrawalForm.reset();
            });
        });
    }

    // --- RECHARGE PAGE: SUBMIT DEPOSIT REQUEST ---
    const rechargeForm = document.getElementById('rechargeForm');
    if (rechargeForm) {
        const messageEl = document.getElementById('recharge-message');
        rechargeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(rechargeForm.amount.value);
            if (isNaN(amount) || amount < 200 || amount > 50000) {
                messageEl.textContent = 'Amount must be between ₹200 and ₹50,000.';
                return;
            }
            db.collection('deposits').add({
                userId: user.uid, userEmail: user.email, amount: amount, status: 'pending',
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                messageEl.textContent = 'Deposit request submitted!';
                rechargeForm.reset();
            });
        });
    }

    // --- HOME PAGE: LOAD INVESTMENT PLANS ---
    const primaryPlans = document.getElementById('primary');
    if (primaryPlans) {
        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            primaryPlans.innerHTML = '';
            snapshot.forEach(doc => {
                const plan = doc.data();
                const cardHTML = `
                    <article class="card">
                        <h3>${plan.planName}</h3>
                        <p>Day Income: ₹${plan.dayIncome}</p>
                        <p>Income Days: ${plan.incomeDays} days</p>
                        <p>Invest Price: ₹${plan.investPrice}</p>
                        <button class="invest-btn">Invest Now</button>
                    </article>`;
                primaryPlans.innerHTML += cardHTML;
            });
        });
    }
}
