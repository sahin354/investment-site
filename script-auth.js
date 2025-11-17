// script-auth.js

// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();

// --- Global variable to hold the current user's ID ---
let currentUserId = null;

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User is logged in:", user.uid);
    } else {
        currentUserId = null;
        console.log("No user is logged in.");
    }
});

// Helper function to convert a mobile number to a dummy email
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // REPLACE 'yourdomain.com' with your actual domain
    return `${cleanedMobile}@adanisite.auth`; 
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
                alert("Please enter mobile number and password.");
                return;
            }

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;
            const email = mobileToEmail(mobileNumber); 

            const loginButton = loginForm.querySelector('button[type="submit"]');
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Logging in...';
            }

            try {
                await auth.signInWithEmailAndPassword(email, password);
                alert("Login successful!");
                window.location.href = 'index.html'; 
            } catch (error) {
                console.error("Login error:", error.code, error.message);
                let errorMessage = "Login failed.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                    errorMessage = "Invalid mobile number or password.";
                } else {
                    errorMessage = error.message;
                }
                alert(errorMessage);
            } finally {
                if (loginButton) {
                    loginButton.disabled = false;
                    loginButton.textContent = 'Login';
                }
            }
        });
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

            if (!mobileInput || !passwordInput) return;

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password;

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }

            const email = mobileToEmail(mobileNumber);
            const registerButton = registerForm.querySelector('button[type="submit"]');
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.textContent = 'Registering...';
            }

            try {
                // --- CRITICAL FIX: Removed the database search here ---
                
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;

                // Create user document
                await db.collection("users").doc(user.uid).set({
                    uid: user.uid,
                    email: user.email,
                    mobileNumber: mobileNumber,
                    balance: 0, 
                    totalRechargeAmount: 0,
                    vipLevel: 'standard',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("Registration successful! Please log in.");
                window.location.href = 'login.html';

            } catch (error) {
                console.error("Registration error:", error.code, error.message);
                let errorMessage = "Registration failed.";
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = "This mobile number is already registered.";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Password should be at least 6 characters.";
                } else {
                    errorMessage = error.message;
                }
                alert(errorMessage);
            } finally {
                if (registerButton) {
                    registerButton.disabled = false;
                    registerButton.textContent = 'Register';
                }
            }
        });
    }
});

// --- Logout ---
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
}
