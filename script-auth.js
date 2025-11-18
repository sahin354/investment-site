// script-auth.js

// Ensure Firebase is globally available (from firebaseConfig.js)
// Access global Firebase services
const auth = window.auth || firebase.auth();
const db = window.db || firebase.firestore();
const functions = window.functions || firebase.functions(); // If you use cloud functions

// --- Global variable to hold the current user's ID ---
let currentUserId = null;

// Set persistence to LOCAL for stable sessions across browser restarts
// This helps prevent "logged out" issues
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Firebase Auth persistence set to LOCAL.");
    })
    .catch((error) => {
        console.error("Error setting Firebase Auth persistence:", error);
    });

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User is logged in (onAuthStateChanged):", user.uid, user.email);
        // You might want to update UI elements here if needed
    } else {
        currentUserId = null;
        console.log("No user is logged in (onAuthStateChanged).");
        // Redirect to login if user is not authenticated on protected pages
        if (window.location.pathname !== '/login.html' && window.location.pathname !== '/register.html') {
             // Optional: If you want to force redirect on ALL non-auth pages
             // window.location.href = 'login.html';
        }
    }
});

// Helper function to convert a mobile number to a dummy email format
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // REPLACE 'yourdomain.com' with your actual domain. Ensure it matches what's in Firestore.
    return `${cleanedMobile}@adanisite.auth`; 
}


// --- Login Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginIdInput = document.getElementById('loginId');
        const passwordInput = document.getElementById('password'); // Matches your HTML ID
        const togglePassword = document.getElementById('togglePassword');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        // Password Toggle
        if (togglePassword && passwordInput) {
            togglePassword.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                togglePassword.textContent = type === 'password' ? '👁️' : '🙈';
            });
        }

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }

            const loginId = loginIdInput ? loginIdInput.value : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!loginId || !password) {
                alert("Please enter both ID and password.");
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Login'; }
                return;
            }

            let userEmail = loginId;
            // Determine if input is mobile or email
            if (!loginId.includes('@')) {
                 userEmail = mobileToEmail(loginId);
            }

            try {
                await auth.signInWithEmailAndPassword(userEmail, password);
                console.log("Login successful. Redirecting...");
                alert("Login successful!"); // Alert before redirect
                window.location.href = 'index.html'; 

            } catch (error) {
                console.error("Login Error:", error.code, error.message);
                let errorMessage = "Login failed. Please check your ID and password.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage = "Invalid ID or password.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Please enter a valid ID format.";
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage = "Network error. Please check your internet connection.";
                } else {
                     errorMessage = error.message;
                }
                alert(errorMessage);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
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
        const registerBtn = registerForm.querySelector('button[type="submit"]');

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            if (registerBtn) {
                 registerBtn.disabled = true;
                 registerBtn.textContent = 'Registering...';
            }

            // Assuming your register.html has inputs with these NAME attributes
            const name = registerForm.querySelector('input[name="name"]') ? registerForm.querySelector('input[name="name"]').value : '';
            const phone = registerForm.querySelector('input[name="phone"]') ? registerForm.querySelector('input[name="phone"]').value : '';
            const email = registerForm.querySelector('input[name="email"]') ? registerForm.querySelector('input[name="email"]').value : '';
            const password = registerForm.querySelector('input[name="password"]') ? registerForm.querySelector('input[name="password"]').value : '';
            const confirmPassword = registerForm.querySelector('input[name="confirmPassword"]') ? registerForm.querySelector('input[name="confirmPassword"]').value : '';


            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                if(registerBtn) { registerBtn.disabled = false; registerBtn.textContent = 'Register'; }
                return;
            }
            if (password.length < 6) {
                alert("Password should be at least 6 characters.");
                if(registerBtn) { registerBtn.disabled = false; registerBtn.textContent = 'Register'; }
                return;
            }

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log("Successfully registered Firebase user (UID):", user.uid);

                await db.collection('users').doc(user.uid).set({
                    uid: user.uid,
                    name: name,
                    phone: phone, 
                    email: email, // This is the actual email used for Auth
                    balance: 0,
                    vipLevel: 0,
                    totalRechargeAmount: 0,
                    isBlocked: false,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Registration successful! Please log in.");
                window.location.href = 'login.html'; 

            } catch (error) {
                console.error("Registration Error (createUserWithEmailAndPassword):", error.code, error.message);
                let errorMessage = "Registration failed.";
                if (error.code === 'auth/email-already-in-use') { 
                    errorMessage = "This email address is already registered.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Please enter a valid email address.";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Password should be at least 6 characters.";
                } else if (error.code === 'auth/network-request-failed') {
                    errorMessage = "Network error. Please check your internet connection.";
                } else {
                     errorMessage = error.message;
                }
                alert(errorMessage);
            } finally {
                if (registerBtn) {
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'Register';
                }
            }
        });
    } else {
        console.warn("Register form with ID 'registerForm' not found on this page.");
    }
});


// --- Logout Function (Global Access) ---
window.handleLogout = function() { 
    auth.signOut()
        .then(() => {
            console.log("Logged out successfully.");
            alert("Logged out successfully!");
            window.location.href = 'login.html'; 
        })
        .catch((error) => {
            console.error("Logout error:", error.message);
            alert("Failed to log out: " + error.message);
        });
                                   }
            
