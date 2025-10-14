document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('registerForm').addEventListener('submit', handleRegistration);
    setupPasswordToggle('togglePassword', 'password');
    setupPasswordToggle('toggleConfirmPassword', 'confirmPassword');

});

function handleRegistration(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.textContent = 'Registering...';
    submitButton.disabled = true;

    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            
            user.sendEmailVerification().then(() => {
                alert('Registration successful! A verification link has been sent to your email.');
            });

            return firebase.firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                fullName: fullName,
                email: email,
                phoneNumber: phoneNumber,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isBlocked: false
            });
        })
        .then(() => {
            console.log('User registered and profile created.');
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error("Registration Error: ", error);
            alert("Registration failed: " + error.message);
        })
        .finally(() => {
            submitButton.textContent = 'Register';
            submitButton.disabled = false;
        });
}

function setupPasswordToggle(toggleId, passwordId) {
    const toggleElement = document.getElementById(toggleId);
    const passwordElement = document.getElementById(passwordId);

    if (toggleElement && passwordElement) {
        toggleElement.addEventListener('click', function() {
            const type = passwordElement.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordElement.setAttribute('type', type);
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
}
