document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    // --- PASSWORD TOGGLE FUNCTION ---
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);
        if (passwordInput && toggleIcon) {
            toggleIcon.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                toggleIcon.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }
    }

    // --- REGISTER FORM ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        setupPasswordToggle('password', 'togglePassword');
        setupPasswordToggle('confirmPassword', 'toggleConfirmPassword');

        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('ref')) {
            registerForm.dataset.referralCode = urlParams.get('ref');
        }

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const registerBtn = document.getElementById('registerBtn');
            registerBtn.disabled = true;
            registerBtn.textContent = 'Processing...';

            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match.');
                registerBtn.disabled = false;
                return;
            }

            try {
                // Check if user exists in DB first
                const checkEmail = await db.collection('users').where('email', '==', email).get();
                if (!checkEmail.empty) throw new Error('Email already registered.');

                // Create Auth User
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Send Verification Email
                await user.sendEmailVerification();

                // Create User Document
                const userIdShort = Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    phone: phone,
                    email: email,
                    userId: userIdShort,
                    balance: 0,
                    referralCode: 'REF' + userIdShort,
                    referredBy: registerForm.dataset.referralCode || null,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    isBlocked: false
                });

                window.location.href = 'verify-email.html';

            } catch (error) {
                console.error(error);
                alert(error.message);
                registerBtn.disabled = false;
                registerBtn.textContent = 'Register';
            }
        });
    }

    // --- LOGIN FORM (UPDATED) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        setupPasswordToggle('password', 'togglePassword');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = "Logging in...";

            const loginId = document.getElementById('loginId').value; // Can be email or phone
            const password = document.getElementById('password').value;
            let emailToLogin = loginId;

            try {
                // 1. If loginId is a phone number, find the email
                if (!loginId.includes('@')) {
                    const phoneQuery = await db.collection('users').where('phone', '==', loginId).get();
                    if (phoneQuery.empty) throw new Error('Phone number not found.');
                    emailToLogin = phoneQuery.docs[0].data().email;
                }

                // 2. Sign In
                const userCredential = await auth.signInWithEmailAndPassword(emailToLogin, password);
                const user = userCredential.user;

                // 3. Check Block Status
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && userDoc.data().isBlocked) {
                    await auth.signOut();
                    throw new Error('Your account has been blocked by Admin.');
                }

                // 4. ADMIN REDIRECT LOGIC
                const ADMIN_EMAIL = "sahin54481@gmail.com"; 
                
                if (user.email === ADMIN_EMAIL) {
                    // If Admin, go to control panel
                    window.location.href = 'control-panel.html';
                } else {
                    // Normal user
                    if (user.emailVerified) {
                        window.location.href = 'index.html';
                    } else {
                        await auth.signOut();
                        alert('Please verify your email first.');
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Login";
                    }
                }

            } catch (error) {
                console.error(error);
                alert(error.message);
                submitBtn.disabled = false;
                submitBtn.textContent = "Login";
            }
        });
    }
});
                
