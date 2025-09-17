document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- REGISTRATION LOGIC ---
    // (This part remains the same from our last conversation)
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // ... (your existing, working registration code is here)
        });
    }

    // --- LOGIN LOGIC (Fixed and with Forgot Password) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const loginId = loginForm.loginId.value;
            const password = loginForm.password.value;
            let userEmail = loginId;

            // Find email if user logs in with phone number
            if (!loginId.includes('@') && /^\+?[0-9\s]+$/.test(loginId)) {
                console.log("Attempting login with phone number:", loginId);
                try {
                    const snapshot = await db.collection('users').where('phone', '==', loginId).limit(1).get();
                    if (snapshot.empty) {
                        return alert("No account found with this phone number.");
                    }
                    userEmail = snapshot.docs[0].data().email;
                    console.log("Found associated email:", userEmail);
                } catch (error) {
                    console.error("Error finding user by phone:", error);
                    return alert("An error occurred. Please check the console for details.");
                }
            }
            
            // Attempt to sign in
            auth.signInWithEmailAndPassword(userEmail, password)
                .then((userCredential) => {
                    if (userCredential.user.emailVerified) {
                        window.location.href = 'index.html';
                    } else {
                        auth.signOut();
                        alert("Your email has not been verified. Please check your inbox for the verification link.");
                    }
                })
                .catch((error) => {
                    console.error("Error during login:", error);
                    alert("Login failed: Invalid credentials.");
                });
        });

        // --- FORGOT PASSWORD LOGIC ---
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
                    
