// script-auth.js

// Import specific Firebase services from your firebaseConfig.js
import { auth, db, app } from './firebaseConfig.js'; // Added 'app' for potential future use
// Also import specific Auth functions you use
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
// If you create user documents in Firestore upon registration
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';


// --- Global variable to hold the current user's ID ---
let currentUserId = null;

// Listen for authentication state changes (useful for updating UI across pages)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserId = user.uid;
        console.log("User is logged in:", user.uid, user.email);
        // You can fetch and update user-specific UI data here if needed on auth state change
    } else {
        currentUserId = null;
        console.log("No user is logged in.");
    }
});


// Helper function to convert a mobile number to a dummy email format
// This is critical for using Firebase Email/Password Auth with a mobile number UI
function mobileToEmail(mobileNumber) {
    // Ensure mobile number is clean (e.g., remove spaces, dashes, +)
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // Use a unique domain that won't conflict with real emails
    // REPLACE 'yourdomain.com' with your actual domain or a unique identifier
    return `${cleanedMobile}@yourdomain.com`; 
}

// Helper function to check if a mobile number is already registered
async function isMobileNumberRegistered(mobileNumber) {
    const q = query(collection(db, "users"), where("mobileNumber", "==", mobileNumber));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
}


// --- Login Form Handling ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm'); // Ensure your login form has this ID
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            const mobileInput = document.getElementById('loginMobile');     // <--- NEW: Ensure your mobile input has this ID
            const passwordInput = document.getElementById('loginPassword'); // Ensure your password input has this ID

            if (!mobileInput || !passwordInput) {
                console.error("Login form inputs not found. Check IDs: 'loginMobile', 'loginPassword'.");
                alert("Login form elements missing. Please check the website's configuration.");
                return;
            }

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;

            // Convert mobile number to dummy email for Firebase Auth
            const email = mobileToEmail(mobileNumber);

            // Optional: Disable button and show loading spinner
            const loginButton = loginForm.querySelector('button[type="submit"]');
            if (loginButton) {
                loginButton.disabled = true;
                loginButton.textContent = 'Logging in...';
            }

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log("Successfully logged in user (Firebase UID):", userCredential.user.uid);
                alert("Login successful!");
                window.location.href = 'index.html'; // Redirect to your home page
            } catch (error) {
                console.error("Login error:", error.code, error.message);
                let errorMessage = "Login failed. Please check your mobile number and password.";
                if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage = "Invalid mobile number or password.";
                } else if (error.code === 'auth/invalid-email') { // This might happen if mobileToEmail conversion is bad
                    errorMessage = "Invalid mobile number format.";
                }
                alert(errorMessage);
            } finally {
                // Re-enable button
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
    const registerForm = document.getElementById('registerForm'); // Ensure your register form has this ID
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent default form submission

            const mobileInput = document.getElementById('registerMobile');     // <--- NEW: Ensure mobile input has this ID
            const passwordInput = document.getElementById('registerPassword'); // Ensure password input has this ID
            const confirmPasswordInput = document.getElementById('confirmPassword'); // If you have a confirm password field

            if (!mobileInput || !passwordInput) {
                console.error("Registration form inputs not found. Check IDs: 'registerMobile', 'registerPassword'.");
                alert("Registration form elements missing.");
                return;
            }

            const mobileNumber = mobileInput.value;
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : password; // Handle optional confirm field

            // Basic client-side validation
            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return;
            }
            if (password.length < 6) {
                alert("Password should be at least 6 characters.");
                return;
            }

            // Convert mobile number to dummy email for Firebase Auth
            const email = mobileToEmail(mobileNumber);

            // Optional: Disable button and show loading spinner
            const registerButton = registerForm.querySelector('button[type="submit"]');
            if (registerButton) {
                registerButton.disabled = true;
                registerButton.textContent = 'Registering...';
            }

            try {
                // Check if mobile number is already in use
                if (await isMobileNumberRegistered(mobileNumber)) {
                    throw new Error('mobile-already-in-use'); // Custom error to catch
                }

                // Create Firebase user with the dummy email and actual password
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Successfully registered Firebase user (UID):", user.uid);

                // Create a corresponding user document in Firestore
                await setDoc(doc(db, "users", user.uid), {
                    uid: user.uid,
                    email: user.email,          // Storing the dummy email
                    mobileNumber: mobileNumber, // <--- IMPORTANT: Store the actual mobile number
                    balance: 0, 
                    totalRechargeAmount: 0,
                    vipLevel: 'standard',
                    createdAt: new Date()
                });

                alert("Registration successful! You can now log in.");
                window.location.href = 'login.html'; // Redirect to login page after successful registration

            } catch (error) {
                console.error("Registration error:", error.code, error.message);
                let errorMessage = "Registration failed.";
                if (error.code === 'auth/email-already-in-use' || error.message === 'mobile-already-in-use') {
                    errorMessage = "This mobile number or email is already registered.";
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage = "Please enter a valid mobile number format.";
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = "Password should be at least 6 characters.";
                }
                alert(errorMessage);
            } finally {
                // Re-enable button
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


// --- Logout Function (if you have a logout button) ---
export async function handleLogout() {
    try {
        await signOut(auth);
        alert("Logged out successfully!");
        window.location.href = 'login.html'; // Redirect to login after logout
    } catch (error) {
        console.error("Logout error:", error.message);
        alert("Failed to log out: " + error.message);
    }
}

                          
