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
        if (!user.emailVerified) {
            // Immediately log out users whose emails are not verified.
            auth.signOut();
            return; 
        }
        // If user is verified and on a protected page, run the main scripts.
        runPageSpecificScripts(user);
    } else {
        // If no user is logged in and they are on a protected page, redirect them.
        if (isProtectedPage) {
            window.location.href = 'login.html';
        }
    }
});

// This function holds all the logic that should ONLY run when a user is logged in.
function runPageSpecificScripts(user) {

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
    const userNameEl = document.getElementById('user-name-phone');
    if (userNameEl) { // This checks if we are on the 'mine.html' page
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
            if (isNaN(amount) || amount <= 0 || amount > currentBalance) {
                messageEl.textContent = 'Invalid amount or insufficient balance.';
                return;
            }
            db.collection('withdrawals').add({
                userId: user.uid, userEmail: user.email, amount, status: 'pending',
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
        // (Your existing, working code for recharge would go here)
    }

    // --- HOME PAGE: LOAD PLANS AND HANDLE INVESTMENTS ---
    const primaryContainer = document.getElementById('primary');
    if (primaryContainer) {
        const vipContainer = document.getElementById('vip');
        const purchasedContainer = document.getElementById('purchased');

        // 1. Load available investment plans
        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            primaryContainer.innerHTML = '';
            vipContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const plan = doc.data();
                const cardHTML = `
                    <article class="card">
                        <h3>${plan.planName}</h3>
                        <p>Day Income: ₹${plan.dayIncome}</p>
                        <p>Income Days: ${plan.incomeDays} days</p>
                        <p>Invest Price: ₹${plan.investPrice}</p>
                        <button class="invest-btn" data-planid="${doc.id}" data-price="${plan.investPrice}">Invest Now</button>
                    </article>`;
                if (plan.isVip) {
                    vipContainer.innerHTML += cardHTML;
                } else {
                    primaryContainer.innerHTML += cardHTML;
                }
            });
        });

        // 2. Load user's purchased plans
        db.collection('investments').where('userId', '==', user.uid).onSnapshot(snapshot => {
            purchasedContainer.innerHTML = snapshot.empty ? '<p class="info-text">You have not purchased any plans yet.</p>' : '';
            snapshot.forEach(doc => {
                const investment = doc.data();
                purchasedContainer.innerHTML += `
                    <article class="card">
                        <h3>${investment.planName}</h3>
                        <p>Status: Active</p>
                        <p>Purchased on: ${new Date(investment.purchasedAt.toDate()).toLocaleDateString()}</p>
                        <p>Daily Income: ₹${investment.dayIncome}</p>
                    </article>`;
            });
        });

        // 3. Handle "Invest Now" button clicks
        document.querySelector('main').addEventListener('click', e => {
            if (e.target.classList.contains('invest-btn')) {
                const planId = e.target.dataset.planid;
                const price = parseFloat(e.target.dataset.price);
                if (confirm(`Are you sure you want to invest ₹${price} in this plan?`)) {
                    investInPlan(user, planId, price);
                }
            }
        });
    }
}

// --- INVESTMENT TRANSACTION FUNCTION ---
async function investInPlan(user, planId, price) {
    const userRef = db.collection('users').doc(user.uid);
    const planRef = db.collection('plans').doc(planId);
    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const planDoc = await transaction.get(planRef);
            if (!userDoc.exists || !planDoc.exists) throw new Error("User or Plan not found.");
            
            const userData = userDoc.data();
            const planData = planDoc.data();
            if ((userData.balance || 0) < price) throw new Error("Insufficient balance.");

            const newBalance = userData.balance - price;
            transaction.update(userRef, { balance: newBalance });

            const investmentRef = db.collection('investments').doc();
            transaction.set(investmentRef, {
                userId: user.uid, planId, ...planData,
                purchasedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
        });
        alert("Investment successful!");
    } catch (error) {
        alert(`Investment failed: ${error.message}`);
    }
    }
