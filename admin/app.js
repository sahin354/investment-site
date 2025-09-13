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
// This check prevents Firebase from being initialized more than once.
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- AUTHENTICATION GUARD ---
// This function runs whenever the authentication state changes.
auth.onAuthStateChanged(user => {
    // Check if we are on a page that is NOT the login page.
    const isNotLoginPage = !window.location.pathname.endsWith('login.html');
    
    if (!user && isNotLoginPage) {
        // If no user is logged in AND we are not on the login page,
        // redirect to the login page. This protects all admin pages.
        window.location.href = 'login.html';
    }
});


// --- MAIN SCRIPT EXECUTION ---
// This code runs after the HTML document has fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    
    // This check ensures the dashboard code only runs on the main dashboard page, not on the login page.
    if (document.body.classList.contains('dashboard-body')) {
        
        // --- NAVIGATION LOGIC ---
        const navItems = document.querySelectorAll('.nav-item');
        const pages = document.querySelectorAll('.page');
        const pageTitle = document.getElementById('page-title');

        navItems.forEach(item => {
            if (item.id !== 'logoutBtn') { // Exclude the logout button from this navigation logic
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    const pageId = item.getAttribute('data-page'); // e.g., "dashboard", "users"

                    // Update active class on sidebar links
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');

                    // Show the correct page and hide the others
                    pages.forEach(page => {
                        page.id === pageId ? page.classList.add('active') : page.classList.remove('active');
                    });
                    
                    // Update the header title to match the clicked link
                    pageTitle.textContent = item.textContent;
                });
            }
        });

        // --- LOGOUT LOGIC ---
        const logoutBtn = document.getElementById('logoutBtn');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            auth.signOut().then(() => {
                console.log('User signed out successfully.');
                // The Authentication Guard will automatically redirect to the login page.
            }).catch(error => {
                console.error('Sign out error:', error);
            });
        });
        
        // --- LOAD INITIAL DATA FOR THE DASHBOARD ---
        loadDashboardStats();
    }
});


// --- DATA FETCHING FUNCTIONS ---
function loadDashboardStats() {
    // Get references to the elements we want to update
    const totalUsersEl = document.getElementById('total-users');
    const pendingDepositsEl = document.getElementById('pending-deposits');
    const totalRechargeEl = document.getElementById('total-recharge');

    // Fetch and display the total number of registered users in real-time
    if (totalUsersEl) {
        db.collection('users').onSnapshot(snapshot => {
            totalUsersEl.textContent = snapshot.size;
        }, err => console.error("Error fetching users count:", err));
    }

    // Fetch and display the number of pending deposits in real-time
    if (pendingDepositsEl) {
        db.collection('deposits').where('status', '==', 'pending').onSnapshot(snapshot => {
            pendingDepositsEl.textContent = snapshot.size;
        }, err => console.error("Error fetching pending deposits:", err));
    }
    
    // Fetch and display the total approved recharge amount in real-time
    if (totalRechargeEl) {
        db.collection('deposits').where('status', '==', 'approved').onSnapshot(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount;
            });
            totalRechargeEl.textContent = total.toFixed(2);
        }, err => console.error("Error fetching total recharge:", err));
    }
}
