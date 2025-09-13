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

// --- THE NEW, ROBUST AUTHENTICATION GUARD ---
// This is the core of the fix. It listens for any change in the login state.
auth.onAuthStateChanged(user => {
    // Check if we are on a page that is NOT the login/register page.
    const isProtectedPage = !window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html');

    if (user) {
        // --- USER IS LOGGED IN ---
        console.log('Authentication state changed: User is logged in.', user.uid);
        
        // If the user is logged in, we can now safely run all the code for our protected pages.
        // We wrap all page-specific logic in a function to keep it clean.
        runPageSpecificScripts(user);

    } else {
        // --- USER IS NOT LOGGED IN ---
        console.log('Authentication state changed: User is logged out.');
        
        // If the user is not logged in AND they are trying to access a protected page,
        // redirect them to the login page.
        if (isProtectedPage) {
            console.log('Access denied. Redirecting to login page.');
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
    if (menuBtn && sideMenu && closeBtn) {
        menuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
        closeBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }

    // --- TAB SWITCHING LOGIC (for index.html) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    // --- LOGOUT LOGIC (for both sidebar and mine page) ---
    const logoutBtnSidebar = document.getElementById('logoutBtn');
    const logoutBtnMine = document.getElementById('logoutBtnMine');

    const handleLogout = (event) => {
        event.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut().catch(error => console.error('Logout error:', error));
            // The onAuthStateChanged listener will automatically handle the redirect.
        }
    };
    if (logoutBtnSidebar) {
        logoutBtnSidebar.addEventListener('click', handleLogout);
    }
    if (logoutBtnMine) {
        logoutBtnMine.addEventListener('click', handleLogout);
    }
    
    // --- MINE PAGE: DISPLAY USER DATA ---
    // Check if we are on the mine.html page by looking for a unique element
    const userNameEl = document.getElementById('user-name-phone');
    if (userNameEl) {
        const userDocRef = db.collection('users').doc(user.uid);
        userDocRef.onSnapshot(doc => {
            if (doc.exists) {
                const userData = doc.data();
                document.getElementById('user-name-phone').textContent = `${userData.fullName} (${userData.phone})`;
                document.getElementById('user-email').textContent = userData.email;
                document.getElementById('user-balance').textContent = `₹ ${userData.balance.toFixed(2)}`;
            } else {
                console.error("User document not found in Firestore!");
            }
        });
    }

    // --- RECHARGE PAGE: SUBMIT DEPOSIT REQUEST ---
    const rechargeForm = document.getElementById('rechargeForm');
    if (rechargeForm) {
        const messageEl = document.getElementById('recharge-message');
        rechargeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const amount = parseFloat(rechargeForm.amount.value);
            if (amount < 200 || amount > 50000) {
                messageEl.textContent = 'Amount must be between ₹200 and ₹50,000.';
                messageEl.className = 'error';
                return;
            }
            db.collection('deposits').add({
                userId: user.uid,
                userEmail: user.email,
                amount: amount,
                status: 'pending',
                requestedAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                messageEl.textContent = 'Deposit request submitted successfully!';
                messageEl.className = 'success';
                rechargeForm.reset();
            }).catch(error => {
                messageEl.textContent = 'Error submitting request.';
                messageEl.className = 'error';
                console.error("Error adding deposit:", error);
            });
        });
    }
    }
