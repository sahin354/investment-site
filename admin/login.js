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

// --- MAIN SCRIPT EXECUTION ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const messageEl = document.getElementById('login-message');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            messageEl.textContent = 'Logging in...';
            messageEl.className = '';

            // Step 1: Sign in with email and password
            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const user = userCredential.user;

                    // Step 2: Check if the user has the 'admin' role in Firestore
                    const userDocRef = db.collection('users').doc(user.uid);
                    
                    userDocRef.get().then(doc => {
                        if (doc.exists && doc.data().role === 'admin') {
                            // SUCCESS: User is an admin
                            console.log("Admin user successfully logged in.");
                            // Redirect to the admin dashboard
                            window.location.href = 'index.html';
                        } else {
                            // FAILURE: User is not an admin
                            console.log("Login failed: User is not an admin.");
                            messageEl.textContent = 'Access Denied: You do not have admin privileges.';
                            messageEl.className = 'error';
                            // Log the user out for security
                            auth.signOut();
                        }
                    }).catch(error => {
                        console.error("Error getting user document:", error);
                        messageEl.textContent = 'Error verifying user role.';
                        messageEl.className = 'error';
                        auth.signOut();
                    });

                })
                .catch(error => {
                    // This catches errors like wrong password, user not found, etc.
                    console.error("Login error:", error);
                    if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                        messageEl.textContent = 'Invalid email or password.';
                    } else {
                        messageEl.textContent = 'An error occurred during login.';
                    }
                    messageEl.className = 'error';
                });
        });
    }
});
