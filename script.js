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

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = { /* ... YOUR KEYS ... */ };

// --- INITIALIZE FIREBASE & SERVICES ---
if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const auth = firebase.auth();
const db = firebase.firestore();

// --- THE ROBUST AUTHENTICATION GUARD ---
auth.onAuthStateChanged(user => {
    if (user) {
        if (!user.emailVerified) {
            // If email is not verified, log them out and send to login
            // except for the first time they register.
            const isNewUser = sessionStorage.getItem('isNewUser');
            if (!isNewUser) {
                auth.signOut();
                return;
            }
        }
        sessionStorage.removeItem('isNewUser'); // Clear the flag
        runPageSpecificScripts(user);
    } else {
        const isProtectedPage = !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html');
        if (isProtectedPage) {
            window.location.href = 'login.html';
        }
    }
});

function runPageSpecificScripts(user) {
    // --- SIDEBAR & LOGOUT LOGIC ---
    // (Your existing, working code for this will be here)

    // --- NEW & IMPROVED: LOAD PLANS, PURCHASES, AND HANDLE INVESTMENTS ---
    const primaryContainer = document.getElementById('primary');
    const vipContainer = document.getElementById('vip');
    const purchasedContainer = document.getElementById('purchased');

    if (primaryContainer && vipContainer && purchasedContainer) {
        // 1. Load available investment plans
        db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
            primaryContainer.innerHTML = '';
            vipContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const plan = doc.data();
                const planId = doc.id;
                const cardHTML = `
                    <article class="card">
                        <h3>${plan.planName}</h3>
                        <p>Day Income: ₹${plan.dayIncome}</p>
                        <p>Income Days: ${plan.incomeDays} days</p>
                        <p>Invest Price: ₹${plan.investPrice}</p>
                        <button class="invest-btn" data-planid="${planId}" data-price="${plan.investPrice}">Invest Now</button>
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
            purchasedContainer.innerHTML = '';
            if (snapshot.empty) {
                purchasedContainer.innerHTML = '<p style="text-align:center; padding: 20px;">You have not purchased any plans yet.</p>';
            }
            snapshot.forEach(doc => {
                const investment = doc.data();
                const cardHTML = `
                    <article class="card">
                        <h3>${investment.planName}</h3>
                        <p>Status: Active</p>
                        <p>Purchased on: ${new Date(investment.purchasedAt.toDate()).toLocaleDateString()}</p>
                        <p>Daily Income: ₹${investment.dayIncome}</p>
                    </article>`;
                purchasedContainer.innerHTML += cardHTML;
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

    // --- OTHER PAGE SCRIPTS ---
    // (Your other working scripts for mine.html, recharge.html, etc., will be here)
}

// --- NEW: INVESTMENT TRANSACTION FUNCTION ---
async function investInPlan(user, planId, price) {
    const userRef = db.collection('users').doc(user.uid);
    const planRef = db.collection('plans').doc(planId);

    try {
        await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            const planDoc = await transaction.get(planRef);

            if (!userDoc.exists) throw new Error("User document not found.");
            if (!planDoc.exists) throw new Error("Plan not found.");

            const userData = userDoc.data();
            const planData = planDoc.data();
            const currentBalance = userData.balance || 0;

            if (currentBalance < price) {
                throw new Error("Insufficient balance to make this investment.");
            }

            const newBalance = currentBalance - price;
            transaction.update(userRef, { balance: newBalance });

            // Create a new document in the 'investments' collection
            const investmentRef = db.collection('investments').doc();
            transaction.set(investmentRef, {
                userId: user.uid,
                planId: planId,
                planName: planData.planName,
                investPrice: planData.investPrice,
                dayIncome: planData.dayIncome,
                incomeDays: planData.incomeDays,
                purchasedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            });
        });

        alert("Investment successful!");

    } catch (error) {
        console.error("Investment failed: ", error);
        alert(`Investment failed: ${error.message}`);
    }
}
