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
    // --- Get all our form elements ---
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const resetForm = document.getElementById('resetForm');
    
    const message = document.getElementById('auth-message');

    // --- Get the containers and links for showing/hiding forms ---
    const loginFormContainer = document.getElementById('loginFormContainer');
    const resetContainer = document.getElementById('resetContainer');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const backToLoginLink = document.getElementById('backToLoginLink');

    // --- REGISTRATION LOGIC ---
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = registerForm.fullName.value;
            const email = registerForm.email.value;
            const phone = registerForm.phone.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            if (password !== confirmPassword) {
                message.textContent = 'Passwords do not match.';
                message.className = 'error';
                return;
            }

            const usersRef = db.collection('users');
            const emailQuery = usersRef.where('email', '==', email).get();
            const phoneQuery = usersRef.where('phone', '==', phone).get();

            Promise.all([emailQuery, phoneQuery]).then(results => {
                if (!results[0].empty) {
                    message.textContent = 'This email is already registered. Please login.';
                    message.className = 'error';
                    return;
                }
                if (!results[1].empty) {
                    message.textContent = 'This phone number is already registered. Please login.';
                    message.className = 'error';
                    return;
                }

                auth.createUserWithEmailAndPassword(email, password)
                    .then(userCredential => {
                        const user = userCredential.user;
                        user.sendEmailVerification();
                        db.collection('users').doc(user.uid).set({
                            fullName: fullName,
                            email: email,
                            phone: phone,
                            balance: 0,
                            role: 'user', 
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        }).then(() => {
                            message.textContent = 'Registration successful! A verification email has been sent. Please verify before logging in.';
                            message.className = 'success';
                            registerForm.reset();
                        });
                    }).catch(error => {
                        console.error("Registration error:", error);
                        message.textContent = `Error: ${error.message}`;
                        message.className = 'error';
                    });
            });
        });
    }

    // --- LOGIN LOGIC ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const identifier = loginForm.identifier.value;
            const password = loginForm.password.value;
            let email = identifier;

            if (!identifier.includes('@')) {
                db.collection('users').where('phone', '==', identifier).get()
                    .then(snapshot => {
                        if (snapshot.empty) {
                            message.textContent = 'No account found with that phone number.';
                            message.className = 'error';
                            return;
                        }
                        email = snapshot.docs[0].data().email;
                        signInUser(email, password);
                    });
            } else {
                signInUser(email, password);
            }
        });
    }

    function signInUser(email, password) {
        auth.signInWithEmailAndPassword(email, password)
            .then(userCredential => {
                if (!userCredential.user.emailVerified) {
                    message.textContent = 'Please verify your email before logging in.';
                    message.className = 'error';
                    auth.signOut(); 
                } else {
                    localStorage.setItem('loggedInUser', userCredential.user.uid);
                    window.location.href = 'index.html';
                }
            }).catch(error => {
                console.error("Login error:", error);
                message.textContent = 'Error: Invalid credentials or email not verified.';
                message.className = 'error';
            });
    }
    
    // --- FORGOT PASSWORD NAVIGATION ---
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'none'; // Hide login form
            resetContainer.style.display = 'block';   // Show reset form
            message.textContent = ''; // Clear any old messages
        });
    }
    
    if (backToLoginLink) {
        backToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginFormContainer.style.display = 'block'; // Show login form
            resetContainer.style.display = 'none';    // Hide reset form
            message.textContent = ''; // Clear any old messages
        });
    }

    // --- NEW: HANDLE PASSWORD RESET SUBMISSION ---
    if (resetForm) {
        resetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = resetForm.resetEmail.value;
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    message.textContent = 'Password reset email sent! Please check your inbox.';
                    message.className = 'success';
                })
                .catch(error => {
                    console.error("Password reset error:", error);
                    message.textContent = "Could not send reset email. Please ensure the email is correct.";
                    message.className = 'error';
                });
        });
    }
});
