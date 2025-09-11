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
const db = firebase.firestore();


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
            // Step 1: Check if email or phone already exists in our database
            const emailQuery = await db.collection('users').where('email', '==', email).get();
            if (!emailQuery.empty) {
                messageDiv.textContent = "Error: This email is already registered.";
                return;
            }
            const phoneQuery = await db.collection('users').where('phone', '==', phone).get();
            if (!phoneQuery.empty) {
                messageDiv.textContent = "Error: This phone number is already registered.";
                return;
            }

            // Step 2: Create user with Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Step 3: Send verification email
            await user.sendEmailVerification();
            
            // Step 4: Create a user profile document in Firestore database
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                fullName: fullName,
                email: email,
                phone: phone,
                balance: 0, // IMPORTANT: New users start with a balance of 0
                agentBalance: 0,
                registrationDate: firebase.firestore.FieldValue.serverTimestamp()
            });

            messageDiv.textContent = "Registration successful! Please check your email to verify your account before logging in.";
            
        } catch (error) {
            console.error("Registration Error:", error);
            messageDiv.textContent = `Error: ${error.message}`;
        }
    });
}


// --- LOGIN LOGIC (No changes here, but keeping it for completeness) ---
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
            // Check if loginId is a phone number
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
                auth.signOut();
                return;
            }
            
            localStorage.setItem('loggedIn', 'true');
            // NEW: Save the user's UID to local storage to fetch their data later
            localStorage.setItem('userUid', user.uid);
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Login Error:", error);
            messageDiv.textContent = `Error: ${error.message}`;
        }
    });
    }
