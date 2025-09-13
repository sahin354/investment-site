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
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const loginForm = document.getElementById('adminLoginForm');
const errorMessage = document.getElementById('login-error');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful, redirect to the dashboard
            window.location.href = 'index.html';
        })
        .catch((error) => {
            // Display an error message to the user
            errorMessage.textContent = 'Error: Invalid email or password.';
            console.error("Login failed:", error.message);
        });
});
