// script-auth.js

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Access global Firebase services
    const auth = window.auth || firebase.auth();
    const db = window.db || firebase.firestore();

    // --- Login Form ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Setup Password Toggle
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('loginPassword');
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Logging in...';

            const loginId = document.getElementById('loginId').value; // Matches your HTML
            const password = document.getElementById('password').value; // Matches your HTML 'password' input ID (which is actually 'password' in your HTML, not 'loginPassword')

            // Correction: Your HTML uses id="password", not id="loginPassword"
            // Let's fix the selector above to match your HTML
            const actualPasswordInput = document.getElementById('password');
            const actualPassword = actualPasswordInput ? actualPasswordInput.value : password;


            let userEmail = loginId;

            // Helper: Simple mobile to email
            function mobileToEmail(mobile) {
                return `${mobile.replace(/\D/g, '')}@adanisite.auth`;
            }

            try {
                // Determine if input is mobile or email
                if (!loginId.includes('@')) {
                     // Assume it's a mobile number, convert to dummy email directly
                     // We CANNOT search the database for the email because Rules block it for unauthenticated users
                     userEmail = mobileToEmail(loginId);
                }

                await auth.signInWithEmailAndPassword(userEmail, actualPassword);
                window.location.href = 'index.html';

            } catch (error) {
                console.error("Login Error:", error);
                alert("Login failed: " + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }

    // --- Registration Form ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
         // ... Setup toggles similar to login ...

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const registerBtn = document.getElementById('registerBtn'); // Check if this ID exists in your register.html
            if(registerBtn) {
                 registerBtn.disabled = true;
                 registerBtn.textContent = 'Registering...';
            }

            // Assuming your register.html has name attributes: name, phone, email, password
            const name = registerForm.querySelector('input[name="name"]').value;
            const phone = registerForm.querySelector('input[name="phone"]').value;
            const email = registerForm.querySelector('input[name="email"]').value;
            const password = registerForm.querySelector('input[name="password"]').value;
            const confirmPassword = registerForm.querySelector('input[name="confirmPassword"]').value;

            if (password !== confirmPassword) {
                alert("Passwords do not match");
                if(registerBtn) { registerBtn.disabled = false; registerBtn.textContent = 'Register'; }
                return;
            }

            try {
                // 1. Create Auth User
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // 2. Create Firestore Document
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    phone: phone, // Store actual phone
                    email: email,
                    balance: 0,
                    vipLevel: 0,
                    totalRechargeAmount: 0,
                    isBlocked: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Registration Successful!");
                window.location.href = 'index.html'; // Or login.html

            } catch (error) {
                console.error("Registration Error:", error);
                alert(error.message);
            } finally {
                 if(registerBtn) { registerBtn.disabled = false; registerBtn.textContent = 'Register'; }
            }
        });
    }
});
