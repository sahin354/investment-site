document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- NEW REGISTRATION LOGIC with Email Verification ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // This stops the page from reloading
            
            const registerBtn = document.getElementById('registerBtn');
            registerBtn.disabled = true; // Disable button to prevent multiple clicks
            registerBtn.textContent = 'Registering...';

            const name = registerForm.name.value;
            const phone = registerForm.phone.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;

            // --- Validation Checks ---
            if (!name || !phone || !email || !password || !confirmPassword) {
                alert('Please fill in all fields.');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }
            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }

            // --- Check if email or phone already exist ---
            try {
                const emailCheck = db.collection('users').where('email', '==', email).get();
                const phoneCheck = db.collection('users').where('phone', '==', phone).get();
                const [emailSnapshot, phoneSnapshot] = await Promise.all([emailCheck, phoneCheck]);

                if (!emailSnapshot.empty) {
                    alert('This email is already registered. Please log in.');
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Register';
                    return;
                }
                if (!phoneSnapshot.empty) {
                    alert('This phone number is already registered. Please log in.');
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Register';
                    return;
                }
            } catch (error) {
                console.error("Error checking for existing user:", error);
                alert("Could not complete registration. Please try again.");
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }
            
            // --- Create User and Send Verification Email ---
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                await user.sendEmailVerification();

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
                
                window.location.href = 'verify-email.html';

            } catch (error) {
                console.error("Error during registration: ", error);
                alert(`Registration failed: ${error.message}`);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
        });
    }

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // ... (login logic remains the same)
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = loginForm.loginId.value;
            const password = loginForm.password.value;
            let userEmail = loginId;

            if (!loginId.includes('@') && /^\+?[0-9\s]+$/.test(loginId)) {
                try {
                    const snapshot = await db.collection('users').where('phone', '==', loginId).limit(1).get();
                    if (snapshot.empty) throw new Error("No account found with this phone number.");
                    userEmail = snapshot.docs[0].data().email;
                } catch (error) {
                    return alert(error.message);
                }
            }
            
            try {
                const userCredential = await auth.signInWithEmailAndPassword(userEmail, password);
                if (userCredential.user.emailVerified) {
                    window.location.href = 'index.html';
                } else {
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
