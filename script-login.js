document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    setupPasswordToggle('toggleLoginPassword', 'password');

});

function handleLogin(e) {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    firebase.firestore().collection('users').where("phoneNumber", "==", phoneNumber).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                throw new Error("Invalid phone number or password.");
            }
            
            let userEmail;
            querySnapshot.forEach((doc) => { userEmail = doc.data().email; });

            return firebase.auth().signInWithEmailAndPassword(userEmail, password);
        })
        .then((userCredential) => {
            if (!userCredential.user.emailVerified) {
                alert("Please verify your email before logging in. A new verification link has been sent.");
                userCredential.user.sendEmailVerification();
                firebase.auth().signOut();
                return Promise.reject("Email not verified"); // Stop promise chain
            }
            console.log('Login successful!');
            window.location.href = 'index.html';
        })
        .catch((error) => {
            if (error !== "Email not verified") {
                console.error("Login Error: ", error);
                alert("Login failed: " + error.message);
            }
        })
        .finally(() => {
            submitButton.textContent = 'Login';
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
