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

const path = window.location.pathname;
const messageEl = document.getElementById('message');

if (path.includes("register.html")) {
    const registerBtn = document.getElementById('registerBtn');
    const fullNameInput = document.getElementById('fullName');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');

    registerBtn.addEventListener('click', async () => {
        const fullName = fullNameInput.value.trim();
        const email = emailInput.value.trim();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;

        if (!fullName || !email || !phone || !password) {
            messageEl.textContent = "Please fill in all fields.";
            messageEl.className = 'message error';
            return;
        }

        try {
            messageEl.textContent = "Checking details...";
            messageEl.className = 'message';

            // Check if email is already in use
            const emailCheck = await db.collection('users').where('email', '==', email).get();
            if (!emailCheck.empty) {
                messageEl.textContent = "This email is already registered. Please login.";
                messageEl.className = 'message error';
                return;
            }

            // Check if phone number is already in use
            const phoneCheck = await db.collection('users').where('phone', '==', phone).get();
            if (!phoneCheck.empty) {
                messageEl.textContent = "This phone number is already registered. Please login.";
                messageEl.className = 'message error';
                return;
            }

            // Create user in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Send verification email
            await user.sendEmailVerification();

            // Store user info in Firestore Database
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                fullName: fullName,
                email: email,
                phone: phone,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            messageEl.textContent = "Registration successful! Please check your email to verify your account.";
            messageEl.className = 'message success';

        } catch (error) {
            messageEl.textContent = error.message;
            messageEl.className = 'message error';
        }
    });

} else if (path.includes("login.html")) {
    const loginBtn = document.getElementById('loginBtn');
    const accountInput = document.getElementById('account');
    const passwordInput = document.getElementById('password');

    loginBtn.addEventListener('click', async () => {
        const account = accountInput.value.trim();
        const password = passwordInput.value;

        if (!account || !password) {
            messageEl.textContent = "Please enter your details.";
            messageEl.className = 'message error';
            return;
        }

        try {
            let userEmail = account;

            // If user enters a phone number, find the associated email from Firestore
            if (!account.includes('@')) {
                const userQuery = await db.collection('users').where('phone', '==', account).get();
                if (userQuery.empty) {
                    throw new Error("Invalid phone number or password.");
                }
                userEmail = userQuery.docs[0].data().email;
            }

            // Sign in with the email
            const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
            const user = userCredential.user;

            // IMPORTANT: Check if the user has verified their email
            if (!user.emailVerified) {
                auth.signOut(); // Log them out immediately
                messageEl.textContent = "Your email is not verified. Please check your inbox.";
                messageEl.className = 'message error';
                return;
            }

            // If verified, proceed to the main page
            localStorage.setItem('loggedIn', 'true');
            window.location.href = 'index.html';

        } catch (error) {
            messageEl.textContent = "Invalid credentials. Please try again.";
            messageEl.className = 'message error';
        }
    });
}
