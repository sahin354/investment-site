document.addEventListener('DOMContentLoaded', function() {
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    } else {
        console.error("Login form not found. Check your HTML id.");
    }
    
    // Correctly set up the password toggle for the login page
    setupPasswordToggle('toggleLoginPassword', 'password');

});

function handleLogin(e) {
    e.preventDefault();

    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
    
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.textContent = 'Logging in...';
    submitButton.disabled = true;

    // 1. Find the user document with the matching phone number
    firebase.firestore().collection('users').where("phoneNumber", "==", phoneNumber).get()
        .then((querySnapshot) => {
            if (querySnapshot.empty) {
                // If no document is found, the phone number is not registered.
                throw new Error("Invalid phone number or password.");
            }
            
            // 2. Get the email from the user document we found
            let userEmail;
            querySnapshot.forEach((doc) => { userEmail = doc.data().email; });

            // 3. Use the retrieved email and the entered password to sign in
            return firebase.auth().signInWithEmailAndPassword(userEmail, password);
        })
        .then((userCredential) => {
            // Check if the user's email is verified
            if (!userCredential.user.emailVerified) {
                alert("Please verify your email before logging in. A new verification link has been sent.");
                userCredential.user.sendEmailVerification();
                firebase.auth().signOut(); // Sign out the user
                return Promise.reject("Email not verified"); // Stop the promise chain here
            }
            console.log('Login successful!');
            window.location.href = 'index.html'; // Redirect to the main page
        })
        .catch((error) => {
            // Prevent showing a generic error if it was just an email verification issue
            if (error !== "Email not verified") {
                console.error("Login Error: ", error);
                alert("Login failed: " + error.message);
            }
        })
        .finally(() => {
            // This will run whether the login succeeds or fails
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
            // Change the icon based on the visibility
            this.textContent = type === 'password' ? '👁️' : '🔒';
        });
    } else {
        console.error("Password toggle elements not found. Check your HTML ids:", toggleId, passwordId);
    }
}
