document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- REGISTRATION LOGIC ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const referralCode = registerForm.referralCode.value; // Optional referral code from friend

            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // User account created in Firebase Authentication.
                    // Now, create the user's profile in Firestore.
                    const user = userCredential.user;
                    
                    // Generate a unique, shorter user ID (e.g., 8 digits)
                    const uniqueUserId = Date.now().toString().slice(-5) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

                    db.collection('users').doc(user.uid).set({
                        uid: user.uid,
                        email: email,
                        userId: uniqueUserId,
                        balance: 0, // Set initial balance to 0
                        vipLevel: 0, // Set initial VIP level to 0
                        referralCode: `REF${Date.now().toString().slice(-7)}`, // Generate a new referral code for this user
                        referredBy: referralCode || null, // Store who referred them
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).then(() => {
                        console.log("User profile created in Firestore.");
                        window.location.href = 'index.html'; // Redirect to home page
                    }).catch(error => {
                        console.error("Error creating user profile in Firestore: ", error);
                    });
                })
                .catch((error) => {
                    console.error("Error during registration: ", error);
                    alert(`Registration failed: ${error.message}`);
                });
        });
    }

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = loginForm.email.value;
            const password = loginForm.password.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    window.location.href = 'index.html';
                })
                .catch((error) => {
                    console.error("Error during login: ", error);
                    alert(`Login failed: ${error.message}`);
                });
        });
    }
});
              
