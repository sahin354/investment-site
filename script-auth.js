// script-auth.js - FOR CDN-BASED (NON-MODULE) SETUP WITH MOBILE LOGIN

// Assuming Firebase is globally available from CDN scripts and firebaseConfig.js has initialized it.
// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // If functions are used in auth.js


// --- Global variable to hold the current user's ID ---
let currentUserId = null;

// Listen for authentication state changes (using global firebase.auth())
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User is logged in (global):", user.uid, user.email);
        // You can fetch and update user-specific UI data here if needed on auth state change
    } else {
        currentUserId = null;
        console.log("No user is logged in (global).");
    }
});


// Helper function to convert a mobile number to a dummy email format
// This is critical for using Firebase Email/Password Auth with a mobile number UI
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // REPLACE 'yourdomain.com' with your actual domain or a unique identifier
    return `${cleanedMobile}@yourdomain.com`; 
}

// Helper function to check if a mobile number is already registered in Firestore
async function isMobileNumberRegistered(mobileNumber) {
    try {
        const querySnapshot = await db.collection("users").where("mobileNumber", "==", mobileNumber).get();
        return !querySnapshot.empty;
    } catch (error) {
        console.error("Error checking mobile number registration:", error);
        return false; // Assume not registered if error, or handle more robustly
    }
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
                // Use Firebase Auth sign-in method
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
                console.error("Registration form inputs not found. Check HTML IDs: 'registerMobile', 'registerPassword'.");
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
                // Check if mobile number is already in use
                if (await isMobileNumberRegistered(mobileNumber)) {
                    throw { code: 'custom/mobile-already-in-use', message: "This mobile number is already registered." };
                }

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
                if (error.code === 'auth/email-already-in-use' || error.code === 'custom/mobile-already-in-use') {
                    errorMessage = "This mobile number or email is already registered.";
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
// This function needs to be called from your logout button's event listener (e.g., in index.html)
// Example: document.getElementById('logoutButton').addEventListener('click', handleLogout);
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

// Attach handleLogout to a global scope or specific button if needed on other pages
// If you want to call handleLogout from other scripts, you'll need a mechanism
// For simple direct HTML call, you can add onclick="handleLogout()" to your button
// Or in script-control.js if it manages global listeners.
            
