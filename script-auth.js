document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- NEW REGISTRATION LOGIC with Email Verification ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = registerForm.name.value;
            const phone = registerForm.phone.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            // --- Validation Checks ---
            if (!name || !phone || !email || !password || !confirmPassword) {
                return alert('Please fill in all fields.');
            }
            if (password !== confirmPassword) {
                return alert('Passwords do not match.');
            }
            if (password.length < 6) {
                return alert('Password must be at least 6 characters long.');
            }

            // --- Check if email or phone already exist ---
            try {
                const emailCheck = db.collection('users').where('email', '==', email).get();
                const phoneCheck = db.collection('users').where('phone', '==', phone).get();
                const [emailSnapshot, phoneSnapshot] = await Promise.all([emailCheck, phoneCheck]);

                if (!emailSnapshot.empty) {
                    return alert('This email is already registered. Please log in.');
                }
                if (!phoneSnapshot.empty) {
                    return alert('This phone number is already registered. Please log in.');
                }
            } catch (error) {
                console.error("Error checking for existing user:", error);
                return alert("Could not complete registration. Please try again.");
            }
            
            // --- Create User and Send Verification Email ---
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Send the verification email
                await user.sendEmailVerification();

                // Create the user profile in Firestore
                const uniqueUserId = Date.now().toString().slice(-5) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    phone: phone,
                    email: email,
                    userId: uniqueUserId,
                    balance: 0,
                    vipLevel: 0,
                    referralCode: `REF${Date.now().toString().slice(-7)}`,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                // Redirect to the "verify email" page
                window.location.href = 'verify-email.html';

            } catch (error) {
                console.error("Error during registration: ", error);
                alert(`Registration failed: ${error.message}`);
            }
        });
    }

    // --- LOGIN LOGIC with Email Verification Check ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = loginForm.loginId.value;
            const password = loginForm.password.value;
            let userEmail = loginId;

            // Find email if user logs in with phone number
            if (!loginId.includes('@') && /^\+?[0-9\s]+$/.test(loginId)) {
                try {
                    const snapshot = await db.collection('users').where('phone', '==', loginId).limit(1).get();
                    if (snapshot.empty) throw new Error("No account found with this phone number.");
                    userEmail = snapshot.docs[0].data().email;
                } catch (error) {
                    return alert(error.message);
                }
            }
            
            // Attempt to sign in
            try {
                const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
                
                // *** CRITICAL STEP: Check if email is verified ***
                if (userCredential.user.emailVerified) {
                    // Email is verified, proceed to home page
                    window.location.href = 'index.html';
                } else {
                    // Email not verified, log them out and show a message
                    await auth.signOut();
                    alert("Your email has not been verified. Please check your inbox for the verification link.");
                }
            } catch (error) {
                console.error("Error during login:", error);
                alert(`Login failed: Invalid credentials.`);
            }
        });
    }
});
