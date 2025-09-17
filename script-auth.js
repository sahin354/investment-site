// This script handles all user authentication: registration, login, and password reset.
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
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
                // This is the updated part
                await db.collection('users').doc(user.uid).set({
                    uid: user.uid, name, phone, email, userId: uniqueUserId,
                    balance: 0, vipLevel: 0, totalRechargeAmount: 0, // <-- New field added here
                    referralCode: `REF${Date.now().toString().slice(-7)}`,
                    referredBy: registerForm.dataset.referralCode || null, // Capture referral code
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

    // ... (Your existing, working Login and Forgot Password code remains here) ...
});
