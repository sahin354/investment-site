document.addEventListener('DOMContentLoaded', function() {

    const registerForm = document.getElementById('registerForm');
    
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }

    // --- NEW: Setup for password visibility toggles ---
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
        alert("Passwords do not match. Please try again.");
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
            console.log('User registered and profile created in Firestore.');
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

// --- NEW: Reusable function to control the eye icon ---
function setupPasswordToggle(toggleId, passwordId) {
    const toggleElement = document.getElementById(toggleId);
    const passwordElement = document.getElementById(passwordId);

    if (toggleElement && passwordElement) {
        toggleElement.addEventListener('click', function() {
            // Check the current type of the password input
            const type = passwordElement.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordElement.setAttribute('type', type);
            
            // Change the icon based on the visibility
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    }
        }
              
