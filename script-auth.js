// script-auth.js

// 1. Ensure Firebase services are available globally (from firebaseConfig.js)
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Set Firebase Auth Persistence (for stable sessions)
// This helps prevent unexpected logouts.
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
  .then(() => console.log("Firebase Auth persistence set to LOCAL."))
  .catch(error => console.error("Error setting persistence:", error));

// 3. Global Variable for current user
let currentUserId = null;
firebase.auth().onAuthStateChanged(user => {
  if (user) {
    currentUserId = user.uid;
    console.log("User logged in:", user.uid, user.email);
    // Optional: Redirect to index.html if on login/register page and already logged in
    if (window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html')) {
      window.location.href = 'index.html';
    }
  } else {
    currentUserId = null;
    console.log("No user logged in.");
    // Optional: Redirect to login.html if on a protected page and not logged in
    // For example, if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
    //   window.location.href = 'login.html';
    // }
  }
});

// 4. Helper: Mobile Number to Dummy Email Converter
//    >>> IMPORTANT: This MUST generate the EXACT same email format
//    >>>            as what is stored in Firebase Authentication for your users.
//    >>>            For example, if Firebase stores "+911234567890@adanisite.auth"
//    >>>            then this function needs to generate that exact string.
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); // Removes non-digits
    // If your Firebase Auth stores +91 in the email, uncomment the line below.
    // const formattedMobile = `+91${cleanedMobile}`; 
    // Otherwise, just use the cleaned number.
    const formattedMobile = cleanedMobile; // Assuming no +91 prefix in dummy email
    return `${formattedMobile}@adanisite.auth`; // Ensure this domain matches exactly!
}

// 5. Login Form Handling
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginBtn = loginForm.querySelector('button[type="submit"]');
        if (loginBtn) {
            loginBtn.textContent = "Logging in...";
            loginBtn.disabled = true;
        }

        const mobileInput = document.getElementById('loginMobile') || document.getElementById('loginId');
        const passwordInput = document.getElementById('loginPassword') || document.getElementById('password');

        if (!mobileInput || !passwordInput || !mobileInput.value || !passwordInput.value) {
            alert("Please enter both mobile number and password.");
            if (loginBtn) { loginBtn.textContent = "Login"; loginBtn.disabled = false; }
            return;
        }

        const mobileNumber = mobileInput.value;
        const password = passwordInput.value;
        const email = mobileToEmail(mobileNumber); // Generate dummy email

        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            console.log("User signed in:", userCredential.user.uid);
            // Success! Redirect.
            window.location.href = "index.html"; 
        } catch (error) {
            console.error("Login Error:", error.code, error.message);
            let errorMessage = "Login Failed: ";
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage += "Invalid mobile number or password.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += "Invalid mobile number format.";
            } else {
                errorMessage += error.message; // Show Firebase's message for other errors
            }
            alert(errorMessage);
        } finally {
            if (loginBtn) {
                loginBtn.textContent = "Login";
                loginBtn.disabled = false;
            }
        }
    });
} else {
  console.warn("loginForm not found.");
}

// 6. Registration Form Handling
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const regBtn = document.getElementById('registerBtn') || registerForm.querySelector('button[type="submit"]');
        if (regBtn) {
            regBtn.textContent = "Processing...";
            regBtn.disabled = true;
        }

        const mobileInput = document.getElementById('registerMobile');
        const passwordInput = document.getElementById('registerPassword');
        const confirmPasswordInput = document.getElementById('confirmPassword');

        if (!mobileInput || !passwordInput || !confirmPasswordInput || !mobileInput.value || !passwordInput.value || !confirmPasswordInput.value) {
            alert("Please fill all registration fields.");
            if (regBtn) { regBtn.textContent = "Register"; regBtn.disabled = false; }
            return;
        }

        const mobileNumber = mobileInput.value;
        const password = passwordInput.value;
        const confirmPass = confirmPasswordInput.value;

        if (password !== confirmPass) {
            alert("Passwords do not match!");
            if (regBtn) { regBtn.textContent = "Register"; regBtn.disabled = false; }
            return;
        }
        if (password.length < 6) {
            alert("Password should be at least 6 characters.");
            if (regBtn) { regBtn.textContent = "Register"; regBtn.disabled = false; }
            return;
        }

        const email = mobileToEmail(mobileNumber); // Generate dummy email for Auth

        try {
            // A. Create User in Firebase Authentication
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;
            console.log("User registered:", user.uid);
            
            // B. Create User Profile Document in Firestore
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                mobileNumber: mobileNumber,
                email: email, // Store the dummy email used for Auth
                balance: 0,
                vipLevel: 0,
                totalRechargeAmount: 0,
                isBlocked: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Registration Successful! Please log in.");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Registration Error:", error.code, error.message);
            let errorMessage = "Registration Failed: ";
            if (error.code === 'auth/email-already-in-use') {
                errorMessage += "This mobile number is already registered.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage += "Password should be at least 6 characters.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += "Invalid mobile number format.";
            } else {
                errorMessage += error.message;
            }
            alert(errorMessage);
        } finally {
            if (regBtn) {
                regBtn.textContent = "Register";
                regBtn.disabled = false;
            }
        }
    });
} else {
  console.warn("registerForm not found.");
}

// 7. Logout Function (global access)
window.handleLogout = function() {
    auth.signOut().then(() => {
        console.log("User logged out.");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Logout Error:", error);
        alert("Logout failed: " + error.message);
    });
};
            
