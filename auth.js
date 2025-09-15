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

// auth.js
const auth = firebase.auth();
const db = firebase.firestore();

// --- REGISTRATION LOGIC ---
const registerBtn = document.getElementById('registerBtn');
if (registerBtn) {
    registerBtn.addEventListener('click', () => {
        const fullName = document.getElementById('fullName').value;
        const phone = document.getElementById('phone').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        // Get referral code from URL if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                // Send email verification
                user.sendEmailVerification().then(() => {
                    alert("Registration successful! Please check your email to verify your account.");
                });

                // Store user data in Firestore
                db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    fullName: fullName,
                    phone: phone,
                    email: email,
                    referredBy: refCode || null, // Store who referred them
                    rechargeBalance: 0,
                    withdrawalBalance: 0,
                    vipLevel: 1,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                })
                .then(() => {
                    window.location.href = 'login.html';
                });
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}

// --- LOGIN LOGIC ---
const loginBtn = document.getElementById('loginBtn');
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                if(userCredential.user.emailVerified) {
                    window.location.href = 'index.html';
                } else {
                    alert('Please verify your email before logging in.');
                    auth.signOut();
                }
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}


// --- FORGOT PASSWORD LOGIC ---
const forgotPasswordLink = document.getElementById('forgotPassword');
if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', () => {
        const email = document.getElementById('email').value;
        if (!email) {
            alert("Please enter your email address first.");
            return;
        }
        auth.sendPasswordResetEmail(email)
            .then(() => {
                alert("Password reset email sent!");
            })
            .catch((error) => {
                alert(error.message);
            });
    });
}
