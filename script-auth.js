// script-auth.js

// 1. Get Global Firebase References
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Mobile to Email Converter (Must match exactly)
function mobileToEmail(mobileNumber) {
    const cleanedMobile = mobileNumber.replace(/\D/g, ''); 
    return `${cleanedMobile}@adanisite.auth`; 
}

// 3. Login Logic
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginBtn = loginForm.querySelector('button');
        loginBtn.textContent = "Logging in...";
        loginBtn.disabled = true;

        // Get values
        const mobileInput = document.getElementById('loginMobile') || document.getElementById('loginId'); 
        const password = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value : document.getElementById('password').value;
        
        const mobileNumber = mobileInput.value;
        const email = mobileToEmail(mobileNumber);

        try {
            await auth.signInWithEmailAndPassword(email, password);
            // Success!
            window.location.href = "index.html";
        } catch (error) {
            console.error("Login Error:", error);
            alert("Login Failed: " + error.message);
            loginBtn.textContent = "Login";
            loginBtn.disabled = false;
        }
    });
}

// 4. Registration Logic
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const regBtn = document.getElementById('registerBtn') || registerForm.querySelector('button');
        regBtn.textContent = "Processing...";
        regBtn.disabled = true;

        // Get inputs
        const mobile = document.getElementById('registerMobile').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        
        // Validate
        if(password !== confirmPass) {
            alert("Passwords do not match");
            regBtn.disabled = false; 
            return;
        }

        const email = mobileToEmail(mobile);

        try {
            // A. Create Auth User
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            
            // B. Create User Profile in Firestore
            await db.collection('users').doc(cred.user.uid).set({
                uid: cred.user.uid,
                mobileNumber: mobile,
                email: email,
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
            regBtn.textContent = "Register";
            regBtn.disabled = false;
        }
    });
}

// 5. Logout Logic
function handleLogout() {
    auth.signOut().then(() => {
        window.location.href = "login.html";
    });
                }
