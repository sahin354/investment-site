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

// --- SECURITY GATEKEEPER ---
(() => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const publicPages = ['login.html', 'register.html'];
    const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

    if (!isLoggedIn && !publicPages.includes(currentPage)) {
        window.location.href = 'login.html';
    }
})();

// --- ALL OTHER PAGE LOGIC ---
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // --- LOGOUT LOGIC ---
    function handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            auth.signOut();
            localStorage.removeItem('loggedIn');
            localStorage.removeItem('userUid');
            window.location.href = "login.html";
        }
    }
    
    // Sidebar Logout Button (for index.html)
    const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
    if (sidebarLogoutBtn) {
        sidebarLogoutBtn.addEventListener('click', handleLogout);
    }
    
    // Mine Page Logout Button
    const mineLogoutBtn = document.getElementById('mineLogoutBtn');
    if (mineLogoutBtn) {
        mineLogoutBtn.addEventListener('click', handleLogout);
    }

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

    // --- FETCH AND DISPLAY USER DATA ON MINE PAGE ---
    if (currentPage === 'mine.html') {
        const userUid = localStorage.getItem('userUid');
        if (userUid) {
            db.collection('users').doc(userUid).onSnapshot((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('userName').textContent = userData.fullName;
                    document.getElementById('userPhone').textContent = `(${userData.phone})`;
                    document.getElementById('userBalance').textContent = userData.balance.toFixed(2);
                    document.getElementById('agentBalance').textContent = userData.agentBalance.toFixed(2);
                }
            });
        }
    }

    // --- RECHARGE/DEPOSIT REQUEST LOGIC ---
    const rechargeForm = document.getElementById('rechargeForm');
    if (rechargeForm) {
        rechargeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const amountInput = document.getElementById('amount');
            const amount = parseFloat(amountInput.value);
            const messageDiv = document.getElementById('rechargeMessage');
            const userUid = localStorage.getItem('userUid');

            if (!userUid || isNaN(amount) || amount <= 0) {
                messageDiv.textContent = 'Please enter a valid amount.';
                return;
            }
            messageDiv.textContent = "Submitting request...";
            try {
                await db.collection('deposits').add({
                    userId: userUid,
                    amount: amount,
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageDiv.textContent = 'Deposit request submitted successfully!';
                amountInput.value = '';
            } catch (error) {
                messageDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }
});
