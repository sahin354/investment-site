// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    // ...etc
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// --- LOGIC FOR DIFFERENT PAGES ---
// Check if we are on the login or register page
const path = window.location.pathname;

if (path.includes("register.html")) {
    // --- REGISTRATION LOGIC ---
    const registerBtn = document.getElementById('registerBtn');
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const messageEl = document.getElementById('message');

    registerBtn.addEventListener('click', async () => {
        const fullName = fullNameInput.value;
        const phone = phoneInput.value;
        const email = emailInput.value;
        const password = passwordInput.value;

        // Basic validation
        if (!fullName || !phone || !email || !password) {
            messageEl.textContent = "Please fill in all fields.";
            messageEl.className = 'message error';
            return;
        }

        try {
            messageEl.textContent = "Checking details...";
            messageEl.className = 'message';

            // 1. Check if email already exists
            const emailCheck = await db.collection('users').where('email', '==', email).get();
            if (!emailCheck.empty) {
                messageEl.textContent = "This email is already registered. Please login.";
                messageEl.className = 'message error';
                return;
            }

            // 2. Check if phone number already exists
            const phoneCheck = await db.collection('users').where('phone', '==', phone).get();
            if (!phoneCheck.empty) {
                messageEl.textContent = "This phone number is already registered. Please login.";
                messageEl.className = 'message error';
                return;
            }
            
            // 3. Create user in Firebase Auth
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

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
