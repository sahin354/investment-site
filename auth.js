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

if (path.includes("register.html")) {
    // --- UPDATED REGISTRATION LOGIC ---
    const registerBtn = document.getElementById('registerBtn');
    const phoneInput = document.getElementById('phone');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const messageEl = document.getElementById('message');

    registerBtn.addEventListener('click', async () => {
        const phone = phoneInput.value;
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        // NOTE: We need a dummy email for Firebase Auth, we create it from the phone number
        const email = `${phone}@fakedomain.com`; 

        if (!phone || !password || !confirmPassword) {
            messageEl.textContent = "Please fill in all fields.";
            messageEl.className = 'message error';
            return;
        }
        if (password !== confirmPassword) {
            messageEl.textContent = "Passwords do not match.";
            messageEl.className = 'message error';
            return;
        }

        try {
            messageEl.textContent = "Checking details...";
            messageEl.className = 'message';

            const phoneCheck = await db.collection('users').where('phone', '==', phone).get();
            if (!phoneCheck.empty) {
                messageEl.textContent = "This phone number is already registered. Please login.";
                messageEl.className = 'message error';
                return;
            }
            
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // We don't need email verification for this flow
            
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                phone: phone,
                email: email, // Store the dummy email
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            messageEl.textContent = "Registration successful! You can now login.";
            messageEl.className = 'message success';

        } catch (error) {
            messageEl.textContent = "Registration failed. Phone number may be invalid.";
            messageEl.className = 'message error';
        }
    });

} else if (path.includes("login.html")) {
    // --- UPDATED LOGIN LOGIC ---
    const loginBtn = document.getElementById('loginBtn');
    const accountInput = document.getElementById('account');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');
    
    loginBtn.addEventListener('click', async () => {
        const account = accountInput.value; // This is the phone number
        const password = passwordInput.value;

        if (!account || !password) {
            messageEl.textContent = "Please enter your details.";
            messageEl.className = 'message error';
            return;
        }

        try {
            // Find the user's document using their phone number to get their dummy email
            const userQuery = await db.collection('users').where('phone', '==', account).get();
            if (userQuery.empty) {
                throw new Error("User with this phone number not found.");
            }
            const email = userQuery.docs[0].data().email;

            // Sign in using the retrieved email and the provided password
            await auth.signInWithEmailAndPassword(email, password);
            
            localStorage.setItem('loggedIn', 'true');
            window.location.href = 'index.html';

        } catch (error) {
            messageEl.textContent = "Invalid mobile number or password.";
            messageEl.className = 'message error';
        }
    });
}

            // 4. Send email verification
            await user.sendEmailVerification();
            
            // 5. Store user details in Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                fullName: fullName,
                phone: phone,
                email: email,
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
    // --- LOGIN LOGIC ---
    const loginBtn = document.getElementById('loginBtn');
    const accountInput = document.getElementById('account');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');
    
    loginBtn.addEventListener('click', async () => {
        const account = accountInput.value;
        const password = passwordInput.value;

        if (!account || !password) {
            messageEl.textContent = "Please enter your details.";
            messageEl.className = 'message error';
            return;
        }

        try {
            let email = account;
            // Check if the input is a phone number (simple check: doesn't contain '@')
            if (!account.includes('@')) {
                const userQuery = await db.collection('users').where('phone', '==', account).get();
                if (userQuery.empty) {
                    throw new Error("User with this phone number not found.");
                }
                email = userQuery.docs[0].data().email;
            }

            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                await auth.signOut(); // Log them out immediately
                messageEl.textContent = "Your email is not verified. Please check your inbox.";
                messageEl.className = 'message error';
            } else {
                localStorage.setItem('loggedIn', 'true');
                window.location.href = 'index.html';
            }

        } catch (error) {
            messageEl.textContent = error.message;
            messageEl.className = 'message error';
        }
    });
                                             }
