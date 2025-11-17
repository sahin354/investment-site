// script-auth.js - FOR CDN-BASED (NON-MODULE) SETUP WITH MOBILE LOGIN

// Assuming Firebase is globally available from CDN scripts and firebaseConfig.js has initialized it.
// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Initialize Cloud Functions if used in other parts of your app

// --- Global variable to hold the current user's ID ---
let currentUserId = null;

// Listen for authentication state changes (using global firebase.auth())
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User is logged in (global):", user.uid, user.email);
    } else {
        currentUserId = null;
        console.log("No user is logged in (global).");
    }
});


// Helper function to convert a mobile number to a dummy email format
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // REPLACE 'yourdomain.com' with your actual domain or a unique identifier
    return `${cleanedMobile}@yourdomain.com`; 
}


// --- Login Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const mobileInput = document.getElementById('loginMobile');
            const passwordInput = document.getElementById('loginPassword');

            if (!mobileInput || !passwordInput) {
                console.error("Login form inputs not found. Check HTML IDs: 'loginMobile', 'loginPassword'.");
                alert("Login form elements missing. Please check the website's configuration.");
                return;
            }

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;
            const email = mobileToEmail(mobileNumber); // Convert to dummy email

            const loginButton = loginForm.querySelector('button[type="submit"]');
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Logging in...';
            }

            try {
                const userCredential = await auth.signInWithEmailAndPassword(email, password);
                console.log("Successfully logged in user (Firebase UID):", userCredential.user.uid);
                alert("Login successful!");
                window.location.href = 'index.html'; // Redirect
            } catch (error) {
                console.error("Login error (auth.signInWithEmailAndPassword):", error.code, error.message);
                let errorMessage = "Login failed. Please check your mobile number and password.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage = "Invalid mobile number or password.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Invalid mobile number format provided.";
                }
                alert(errorMessage);
            } finally {
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                }
            }
        });
    } else {
        console.warn("Login form with ID 'loginForm' not found on this page.");
    }
});


// --- Registration Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const mobileInput = document.getElementById('registerMobile');
            const passwordInput = document.getElementById('registerPassword');
            const confirmPasswordInput = document.getElementById('confirmPassword');

            if (!mobileInput || !passwordInput) {
                console.error("Registration form inputs not found. Check IDs: 'registerMobile', 'registerPassword'.");
                alert("Registration form elements missing.");
                return;
            }

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password;

            // Basic client-side validation
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            if (password.length < 6) {
                alert("Password should be at least 6 characters.");
                return;
            }

            const email = mobileToEmail(mobileNumber); // Convert to dummy email

            const registerButton = registerForm.querySelector('button[type="submit"]');
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.textContent = 'Registering...';
            }

            try {
                // *** CRITICAL FIX: REMOVED THE isMobileNumberRegistered CHECK HERE ***
                // This Firestore query was getting blocked by security rules for non-admin users.
                // Firebase Auth's createUserWithEmailAndPassword will handle 'email-already-in-use' naturally.

                // Create Firebase user with the dummy email and actual password
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log("Successfully registered Firebase user (UID):", user.uid);

                // Create a corresponding user document in Firestore
                await db.collection("users").doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,          // Storing the dummy email
                    mobileNumber: mobileNumber, // IMPORTANT: Store the actual mobile number
                    balance: 0, 
                    totalRechargeAmount: 0,
                    vipLevel: 'standard',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Use server timestamp
                });

                alert("Registration successful! You can now log in.");
                window.location.href = 'login.html'; // Redirect
            } catch (error) {
                console.error("Registration error (auth.createUserWithEmailAndPassword):", error.code, error.message);
                let errorMessage = "Registration failed.";
                if (error.code === 'auth/email-already-in-use') { // This now covers mobile number already in use
                    errorMessage = "This mobile number is already registered.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Please enter a valid mobile number format.";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Password should be at least 6 characters.";
                }
                alert(errorMessage);
            } finally {
                if (registerButton) {
                    registerButton.disabled = false;
                    registerButton.textContent = 'Register';
                }
            }
        });
    } else {
        console.warn("Register form with ID 'registerForm' not found on this page.");
    }
});


// --- Logout Function (Global Access) ---
function handleLogout() { // Changed to non-exported function for global use
    auth.signOut()
        .then(() => {
            alert("Logged out successfully!");
            window.location.href = 'login.html'; // Redirect to login after logout
        })
        .catch((error) => {
            console.error("Logout error:", error.message);
            alert("Failed to log out: " + error.message);
        });
}

// If you have a logout button on mine.html, ensure it calls handleLogout()
// Example in mine.html: <button onclick="handleLogout()">Log Out</button>
                    
