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

// --- MAIN SCRIPT EXECUTION ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const messageEl = document.getElementById('login-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginForm.email.value;
        const password = loginForm.password.value;
        messageEl.textContent = 'Logging in...';

        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                const user = userCredential.user;
                const userDocRef = db.collection('users').doc(user.uid);
                
                userDocRef.get().then(doc => {
                    if (doc.exists && doc.data().role === 'admin') {
                        window.location.href = 'index.html';
                    } else {
                        messageEl.textContent = 'Access Denied: You do not have admin privileges.';
                        auth.signOut();
                    }
                });
            })
            .catch(error => {
                messageEl.textContent = 'Invalid email or password.';
            });
    });
});
