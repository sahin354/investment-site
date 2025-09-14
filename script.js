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
    if (user && user.emailVerified) {
        runPageSpecificScripts(user);
    } else {
        if (isProtectedPage) {
            auth.signOut();
            window.location.href = 'login.html';
        }
    }
});

function runPageSpecificScripts(user) {
    // --- SIDEBAR MENU LOGIC ---
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    if (menuBtn && sideMenu && closeBtn) {
        menuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
        closeBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }

    // --- UNIFIED LOGOUT LOGIC ---
    const handleLogout = () => { if (confirm('Are you sure you want to logout?')) auth.signOut(); };
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

    // --- HOME PAGE LOGIC (VIP/PURCHASED TABS ARE NOW FIXED) ---
    const primaryContainer = document.getElementById('primary');
    if (primaryContainer) {
        // --- FIXED: TAB SWITCHING LOGIC ---
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(targetTab)?.classList.add('active');
            });
        });

        // Load available investment plans
        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            primaryContainer.innerHTML = '';
            document.getElementById('vip').innerHTML = '';
            snapshot.forEach(doc => {
                const plan = doc.data();
                const cardHTML = `<article class="card"><h3>${plan.planName}</h3><p>Day Income: ₹${plan.dayIncome}</p><p>Income Days: ${plan.incomeDays} days</p><p>Invest Price: ₹${plan.investPrice}</p><button class="invest-btn" data-planid="${doc.id}" data-price="${plan.investPrice}">Invest Now</button></article>`;
                if (plan.isVip) { document.getElementById('vip').innerHTML += cardHTML; } 
                else { primaryContainer.innerHTML += cardHTML; }
            });
        });

        // Load user's purchased plans
        db.collection('investments').where('userId', '==', user.uid).orderBy('purchasedAt', 'desc').onSnapshot(snapshot => {
            const purchasedContainer = document.getElementById('purchased');
            purchasedContainer.innerHTML = snapshot.empty ? '<p class="info-text">You have no active investments.</p>' : '';
            snapshot.forEach(doc => {
                const investment = doc.data();
                purchasedContainer.innerHTML += `<article class="card"><h3>${investment.planName}</h3><p>Status: Active</p><p>Purchased: ${new Date(investment.purchasedAt.toDate()).toLocaleDateString()}</p><p>Daily Income: ₹${investment.dayIncome}</p></article>`;
            });
        });

        // Handle "Invest Now" button clicks
        document.querySelector('main').addEventListener('click', e => {
            if (e.target.classList.contains('invest-btn')) {
                const planId = e.target.dataset.planid;
                const price = parseFloat(e.target.dataset.price);
                if (confirm(`Invest ₹${price} in this plan?`)) investInPlan(user, planId, price);
            }
        });
    }

    // --- WITHDRAWAL LOGIC WITH YOUR RULES ---
    const withdrawalForm = document.getElementById('withdrawalForm');
    if (withdrawalForm) {
        const messageEl = document.getElementById('withdrawal-message');
        withdrawalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(withdrawalForm.withdrawAmount.value);
            const currentBalance = parseFloat(document.getElementById('user-balance').textContent.replace('₹', '').trim());
            if (isNaN(amount) || amount < 119) {
                messageEl.textContent = 'Minimum withdrawal amount is ₹119.';
                return;
            }
            if (amount > currentBalance) {
                messageEl.textContent = 'Insufficient balance.';
                return;
            }
            const tds = amount * 0.19;
            const finalAmount = amount - tds;
            if (confirm(`Withdrawal Summary:\nRequested: ₹${amount.toFixed(2)}\nTDS (19%): -₹${tds.toFixed(2)}\nAmount to Credit: ₹${finalAmount.toFixed(2)}\nProceed?`)) {
                db.collection('withdrawals').add({
                    userId: user.uid, userEmail: user.email, requestedAmount: amount, tds, finalAmount,
                    status: 'pending', requestedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).then(() => {
                    messageEl.textContent = 'Withdrawal request submitted!';
                    withdrawalForm.reset();
                });
            }
        });
    }
}

async function investInPlan(user, planId, price) {
    const userRef = db.collection('users').doc(user.uid);
    const planRef = db.collection('plans').doc(planId);
    try {
        await db.runTransaction(async (t) => {
            const userDoc = await t.get(userRef);
            const planDoc = await t.get(planRef);
            if (!userDoc.exists || !planDoc.exists) throw new Error("User or Plan not found.");
            const userData = userDoc.data();
            if ((userData.balance || 0) < price) throw new Error("Insufficient balance.");
            t.update(userRef, { balance: userData.balance - price });
            t.set(db.collection('investments').doc(), {
                userId: user.uid, planId, ...planDoc.data(),
                purchasedAt: firebase.firestore.FieldValue.serverTimestamp(), status: 'active'
            });
        });
        alert("Investment successful!");
    } catch (error) {
        alert(`Investment failed: ${error.message}`);
    }
        }
