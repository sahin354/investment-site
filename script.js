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

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();


// --- BULLETPROOF SECURITY GATEKEEPER ---
const currentPage = window.location.pathname.split('/').pop() || 'index.html'; 
const isLoggedIn = localStorage.getItem('loggedIn') === 'true';
console.log(`Page: ${currentPage}, Logged In: ${isLoggedIn}`);
if (!isLoggedIn && currentPage !== 'login.html' && currentPage !== 'register.html') {
    console.log("Security Check: User is NOT logged in. Redirecting to login.html");
    window.location.href = 'login.html';
}


// --- STANDARD PAGE FUNCTIONALITY ---
document.addEventListener('DOMContentLoaded', function() {

    // --- FETCH AND DISPLAY USER DATA ON MINE PAGE ---
    if (currentPage === 'mine.html') {
        const userUid = localStorage.getItem('userUid');
        if (userUid) {
            const userDocRef = db.collection('users').doc(userUid);
            
            // Listen for real-time updates
            userDocRef.onSnapshot((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    document.getElementById('userName').textContent = userData.fullName;
                    document.getElementById('userPhone').textContent = `(${userData.phone})`;
                    document.getElementById('userBalance').textContent = userData.balance.toFixed(2);
                    document.getElementById('agentBalance').textContent = userData.agentBalance.toFixed(2);
                } else {
                    console.log("No such user document!");
                }
            }, (error) => {
                console.log("Error getting user document:", error);
            });
        }
    }

    // --- LOGOUT BUTTON ON MINE PAGE ---
    const mineLogoutBtn = document.getElementById('mineLogoutBtn');
    if (mineLogoutBtn) {
        mineLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                auth.signOut();
                localStorage.removeItem('loggedIn');
                localStorage.removeItem('userUid');
                window.location.href = "login.html";
            }
        });
    }

    // --- RECHARGE/DEPOSIT REQUEST LOGIC ---
    const rechargeBtn = document.getElementById('rechargeBtn');
    if (rechargeBtn) {
        rechargeBtn.addEventListener('click', async () => {
            const amountInput = document.getElementById('amount');
            const amount = parseFloat(amountInput.value);
            const messageDiv = document.getElementById('rechargeMessage');
            const userUid = localStorage.getItem('userUid');

            if (!userUid) {
                messageDiv.textContent = 'Error: You are not logged in.';
                return;
            }
            if (isNaN(amount) || amount <= 0) {
                messageDiv.textContent = 'Please enter a valid amount.';
                return;
            }

            try {
                // Create a new document in the 'deposits' collection
                await db.collection('deposits').add({
                    userId: userUid,
                    amount: amount,
                    status: 'pending', // Status is pending until admin approves
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                messageDiv.textContent = 'Deposit request submitted successfully! An admin will review it shortly.';
                amountInput.value = '';
            } catch (error) {
                console.error("Error submitting deposit: ", error);
                messageDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }
});
