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

const loginBtn = document.getElementById('loginBtn');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Login successful, redirect to the admin dashboard
            window.location.href = 'index.html';
        })
        .catch((error) => {
            errorMessage.textContent = error.message;
        });
});
