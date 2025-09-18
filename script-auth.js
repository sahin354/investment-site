// This is the complete script for all authentication functions.
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- [ REGISTRATION LOGIC ] ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        // Capture referral code from URL when the page loads
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode) {
            // Store it on the form element to access it later during submission
            registerForm.dataset.referralCode = refCode;
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const registerBtn = document.getElementById('registerBtn');
            registerBtn.disabled = true;
            registerBtn.textContent = 'Registering...';

            const name = registerForm.name.value;
            const phone = registerForm.phone.value;
            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const confirmPassword = registerForm.confirmPassword.value;
            const referredByCode = registerForm.dataset.referralCode || null; // Get the stored ref code

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
                return;
            }

            try {
                const emailCheck = db.collection('users').where('email', '==', email).get();
                const phoneCheck = db.collection('users').where('phone', '==', phone).get();
                const [emailSnapshot, phoneSnapshot] = await Promise.all([emailCheck, phoneCheck]);

                if (!emailSnapshot.empty) throw new Error('This email is already registered.');
                if (!phoneSnapshot.empty) throw new Error('This phone number is already registered.');

                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                await user.sendEmailVerification();

                const uniqueUserId = Date.now().toString().slice(-5) + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid, name, phone, email, userId: uniqueUserId,
                    balance: 0, vipLevel: 0, totalRechargeAmount: 0,
                    referralCode: `REF${Date.now().toString().slice(-7)}`,
                    referredBy: referredByCode, // Save the referral code here
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                window.location.href = 'verify-email.html';

            } catch (error) {
                alert(`Registration failed: ${error.message}`);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
        });
    }

    // --- [ LOGIN LOGIC ] ---
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

        // --- [ FORGOT PASSWORD LOGIC ] ---
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                const email = prompt("Please enter your registered email address to receive a password reset link:");
                if (email) {
                    auth.sendPasswordResetEmail(email)
                        .then(() => {
                            alert("Password reset email sent! Please check your inbox.");
                        })
                        .catch((error) => {
                            console.error("Error sending password reset email:", error);
                            alert("Could not send reset email. Please ensure the email address is correct.");
                        });
                }
            });
        }
    }
});
                                                                
