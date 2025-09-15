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

// script.js
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

auth.onAuthStateChanged(user => {
    if (user && user.emailVerified) {
        // User is logged in and verified
        currentUser = user;
        console.log("User logged in:", user.uid);
        populateSidebar(user.uid);
    } else {
        // No user is signed in or not verified, redirect to login page.
        console.log("User not logged in. Redirecting...");
        window.location.replace('login.html');
    }
});

function populateSidebar(userId) {
    const userRef = db.collection('users').doc(userId);
    userRef.get().then(doc => {
        if (doc.exists) {
            const userData = doc.data();
            // Assuming you have elements with these IDs in your sidebar
            document.getElementById('sidebar-user-id').textContent = `ID: ${userId.substring(0, 8)}`;
            document.getElementById('sidebar-vip-level').textContent = `VIP Level: ${userData.vipLevel}`;
        }
    });
}

// --- LOGOUT FUNCTIONALITY (for mine.html) ---
function logout() {
    auth.signOut().then(() => {
        // Sign-out successful, will trigger onAuthStateChanged to redirect
        console.log('User signed out');
    }).catch((error) => {
        console.error('Sign out error', error);
    });
}
