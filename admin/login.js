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

const loginForm = document.getElementById('adminLoginForm');
const errorMessage = document.getElementById('login-error');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Step 1: Authentication successful. User provided correct email and password.
            // NOW, WE MUST CHECK IF THEY ARE AUTHORIZED (i.e., if they are an admin).
            const user = userCredential.user;
            const userDocRef = db.collection('users').doc(user.uid);

            // Go to the database to get this user's profile document.
            return userDocRef.get();
        })
        .then((doc) => {
            // Step 2: We have the user's document. Now, check their role.
            if (doc.exists && doc.data().role === 'admin') {
                // SUCCESS! The user exists in the database AND has the 'admin' role.
                // Allow them to proceed to the dashboard.
                window.location.href = 'index.html';
            } else {
                // FAILURE! This user is not an admin.
                // We must log them out immediately and show an error message.
                auth.signOut();
                errorMessage.textContent = 'Error: You do not have permission to access this page.';
            }
        })
        .catch((error) => {
            // This error will be caught if the email/password was wrong in the first place.
            errorMessage.textContent = 'Error: Invalid email or password.';
            console.error("Login failed:", error.message);
        });
});
