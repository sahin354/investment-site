// script-auth.js

// 1. Get Global References
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Mobile to Email Converter
// This ensures +91 or spaces don't break the login
function mobileToEmail(mobileNumber) {
    // Remove everything that is NOT a number (spaces, +, -)
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    // Create the dummy email
    return `${cleanedMobile}@adanisite.auth`; 
}

// 3. Login Logic
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = loginForm.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Logging in...";
        submitBtn.disabled = true;

        // Get Inputs (Support both ID names you might have used)
        const mobileInput = document.getElementById('loginMobile') || document.getElementById('loginId');
        const passwordInput = document.getElementById('loginPassword') || document.getElementById('password');
        
        const mobileNumber = mobileInput.value.trim();
        const password = passwordInput.value;

        // Convert to Email
        const email = mobileToEmail(mobileNumber);
        console.log("Attempting login with:", email);

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Success
            window.location.href = "index.html";
        } catch (error) {
            console.error("Login Error:", error);
            let msg = "Login Failed.";
            if(error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                msg = "Invalid Mobile Number or Password.";
            } else {
                msg = error.message;
            }
            alert(msg);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 4. Registration Logic
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = registerForm.querySelector('button');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Registering...";
        submitBtn.disabled = true;

        const mobileInput = document.getElementById('registerMobile');
        const passwordInput = document.getElementById('registerPassword');
        const confirmInput = document.getElementById('confirmPassword');

        const mobile = mobileInput.value.trim();
        const password = passwordInput.value;
        const confirm = confirmInput.value;

        if (password !== confirm) {
            alert("Passwords do not match");
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            return;
        }

        const email = mobileToEmail(mobile);
        console.log("Registering with:", email);

        try {
            // Create Auth User
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Create Firestore Profile
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                mobileNumber: mobile,
                email: email, // Store the dummy email
                balance: 0,
                vipLevel: 0,
                totalRechargeAmount: 0,
                isBlocked: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert("Registration Successful!");
            window.location.href = "login.html";

        } catch (error) {
            console.error("Reg Error:", error);
            alert("Registration Failed: " + error.message);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// 5. Logout
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
              }
