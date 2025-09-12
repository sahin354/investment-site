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


document.addEventListener('DOMContentLoaded', () => {

    // --- REGISTRATION LOGIC ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = registerForm.fullName.value;
            const email = registerForm.email.value;
            const phone = registerForm.phone.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const messageDiv = document.getElementById('message');

            if (password !== confirmPassword) {
                messageDiv.textContent = "Error: Passwords do not match.";
                return;
            }

            messageDiv.textContent = "Processing...";

            try {
                // Check if email or phone already exists
                const emailQuery = await db.collection('users').where('email', '==', email).get();
                if (!emailQuery.empty) {
                    messageDiv.textContent = "Error: This email is already registered. Please login.";
                    return;
                }
                const phoneQuery = await db.collection('users').where('phone', '==', phone).get();
                if (!phoneQuery.empty) {
                    messageDiv.textContent = "Error: This phone number is already registered. Please login.";
                    return;
                }

                // Create user with email and password
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Send email verification
                await user.sendEmailVerification();
                
                // Create user profile in Firestore
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    fullName: fullName,
                    email: email,
                    phone: phone,
                    balance: 0,
                    agentBalance: 0,
                    registrationDate: firebase.firestore.FieldValue.serverTimestamp()
                });

                messageDiv.textContent = "Registration successful! A verification link has been sent to your email. Please verify before logging in.";
                
            } catch (error) {
                messageDiv.textContent = `Error: ${error.message}`;
            }
        });
    }


    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = loginForm.loginId.value;
            const password = loginForm.password.value;
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = "Logging in...";

            try {
                let userEmail = loginId;
                // If login ID is not an email, assume it's a phone number
                if (!loginId.includes('@')) {
                    const phoneQuery = await db.collection('users').where('phone', '==', loginId).get();
                    if (phoneQuery.empty) {
                        messageDiv.textContent = "Error: No account found with that phone number.";
                        return;
                    }
                    userEmail = phoneQuery.docs[0].data().email;
                }

                const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
                const user = userCredential.user;

                if (!user.emailVerified) {
                    messageDiv.textContent = "Error: Please verify your email before logging in.";
                    auth.signOut(); // Log out the unverified user
                    return;
                }
                
                // Set flags in localStorage to persist login state
                localStorage.setItem('loggedIn', 'true');
                localStorage.setItem('userUid', user.uid);
                
                // Redirect to the main page
                window.location.href = 'index.html';

            } catch (error) {
                messageDiv.textContent = `Error: Invalid credentials or user not found.`;
                console.error("Login error:", error);
            }
        });
    }
});
                
