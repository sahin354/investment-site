// script-auth.js

// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();

// --- Global variables ---
let currentUserId = null;
let currentUserData = null;
let isAdminUser = false;

// ADMIN UIDs - ADD YOUR ADMIN USER IDs HERE
const ADMIN_UIDS = [
  "uvejqT510MQ9TPBybR2Rcq9kJp42", // Add your actual admin UID
  // Add more admin UIDs as needed
];

// Listen for authentication state changes
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUserId = user.uid;
    console.log("User is logged in:", user.uid);
    
    // Check if user is admin
    isAdminUser = ADMIN_UIDS.includes(user.uid);
    console.log("Is admin:", isAdminUser);
    
    // Load user data
    try {
      const userDoc = await db.collection("users").doc(user.uid).get();
      if (userDoc.exists) {
        currentUserData = userDoc.data();
        console.log("User data loaded:", currentUserData);
        
        // Update UI based on user role
        updateUIForUser();
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  } else {
    currentUserId = null;
    currentUserData = null;
    isAdminUser = false;
    console.log("No user is logged in.");
    updateUIForUser();
  }
});

// Update UI based on authentication state
function updateUIForUser() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  const userInfo = document.getElementById('userInfo');
  
  if (currentUserId) {
    // User is logged in
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (userInfo) {
      userInfo.style.display = 'block';
      userInfo.textContent = `Welcome, ${currentUserData?.mobileNumber || 'User'}`;
    }
    
    // Show admin panel button for admins
    if (adminPanelBtn) {
      adminPanelBtn.style.display = isAdminUser ? 'block' : 'none';
    }
  } else {
    // User is not logged in
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userInfo) userInfo.style.display = 'none';
    if (adminPanelBtn) adminPanelBtn.style.display = 'none';
  }
}

// Helper function to convert mobile number to email
function mobileToEmail(mobileNumber) {
  const cleanedMobile = mobileNumber.replace(/\D/g, '');
  return `${cleanedMobile}@adanisite.auth`;
}

// Format mobile number for display
function formatMobileNumber(mobileNumber) {
  const cleaned = mobileNumber.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  }
  return mobileNumber;
}

// --- Login Form Handling ---
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const mobileInput = document.getElementById('loginMobile');
      const passwordInput = document.getElementById('loginPassword');
      const errorDiv = document.getElementById('loginError');

      if (!mobileInput || !passwordInput) {
        showError(errorDiv, "Please enter mobile number and password.");
        return;
      }

      const mobileNumber = mobileInput.value.trim();
      const password = passwordInput.value;
      
      if (!mobileNumber) {
        showError(errorDiv, "Please enter mobile number.");
        return;
      }
      
      if (!password) {
        showError(errorDiv, "Please enter password.");
        return;
      }

      const email = mobileToEmail(mobileNumber);
      const loginButton = loginForm.querySelector('button[type="submit"]');
      
      if (loginButton) {
        loginButton.disabled = true;
        loginButton.textContent = 'Logging in...';
      }
      
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        console.log("Login successful:", userCredential.user.uid);
        
        // Show success message
        if (errorDiv) {
          errorDiv.style.display = 'block';
          errorDiv.style.color = 'green';
          errorDiv.textContent = 'Login successful! Redirecting...';
        }
        
        // Redirect after short delay
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
        
      } catch (error) {
        console.error("Login error:", error.code, error.message);
        let errorMessage = "Login failed. Please try again.";
        
        switch (error.code) {
          case 'auth/user-not-found':
            errorMessage = "No account found with this mobile number.";
            break;
          case 'auth/wrong-password':
            errorMessage = "Invalid password.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid mobile number format.";
            break;
          case 'auth/user-disabled':
            errorMessage = "This account has been disabled.";
            break;
          case 'auth/too-many-requests':
            errorMessage = "Too many failed attempts. Please try again later.";
            break;
          default:
            errorMessage = error.message;
        }
        
        showError(errorDiv, errorMessage);
      } finally {
        if (loginButton) {
          loginButton.disabled = false;
          loginButton.textContent = 'Login';
        }
      }
    });
  }

  // --- Registration Form Handling ---
  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const mobileInput = document.getElementById('registerMobile');
      const passwordInput = document.getElementById('registerPassword');
      const confirmPasswordInput = document.getElementById('confirmPassword');
      const errorDiv = document.getElementById('registerError');

      if (!mobileInput || !passwordInput || !confirmPasswordInput) {
        showError(errorDiv, "Please fill all fields.");
        return;
      }

      const mobileNumber = mobileInput.value.trim();
      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      // Validation
      if (!mobileNumber) {
        showError(errorDiv, "Please enter mobile number.");
        return;
      }
      
      if (mobileNumber.length < 10) {
        showError(errorDiv, "Please enter a valid 10-digit mobile number.");
        return;
      }
      
      if (password.length < 6) {
        showError(errorDiv, "Password must be at least 6 characters long.");
        return;
      }
      
      if (password !== confirmPassword) {
        showError(errorDiv, "Passwords do not match!");
        return;
      }

      const email = mobileToEmail(mobileNumber);
      const registerButton = registerForm.querySelector('button[type="submit"]');
      
      if (registerButton) {
        registerButton.disabled = true;
        registerButton.textContent = 'Creating Account...';
      }
      
      if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.textContent = '';
      }

      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Create user document in Firestore
        await db.collection("users").doc(user.uid).set({
          uid: user.uid,
          email: user.email,
          mobileNumber: mobileNumber,
          formattedMobile: formatMobileNumber(mobileNumber),
          balance: 0,
          totalRechargeAmount: 0,
          vipLevel: 'standard',
          isAdmin: ADMIN_UIDS.includes(user.uid),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log("Registration successful for user:", user.uid);
        
        // Show success message
        if (errorDiv) {
          errorDiv.style.display = 'block';
          errorDiv.style.color = 'green';
          errorDiv.textContent = 'Registration successful! Redirecting to login...';
        }
        
        // Redirect to login page after short delay
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 2000);

      } catch (error) {
        console.error("Registration error:", error.code, error.message);
        let errorMessage = "Registration failed. Please try again.";
        
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = "This mobile number is already registered.";
            break;
          case 'auth/weak-password':
            errorMessage = "Password should be at least 6 characters.";
            break;
          case 'auth/invalid-email':
            errorMessage = "Invalid mobile number format.";
            break;
          case 'auth/operation-not-allowed':
            errorMessage = "Registration is currently disabled.";
            break;
          default:
            errorMessage = error.message;
        }
        
        showError(errorDiv, errorMessage);
      } finally {
        if (registerButton) {
          registerButton.disabled = false;
          registerButton.textContent = 'Register';
        }
      }
    });
  }
});

// Helper function to show errors
function showError(errorElement, message) {
  if (errorElement) {
    errorElement.style.display = 'block';
    errorElement.style.color = 'red';
    errorElement.textContent = message;
  } else {
    alert(message);
  }
}

// --- Logout Function ---
function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    auth.signOut().then(() => {
      console.log("User signed out successfully");
      window.location.href = 'login.html';
    }).catch((error) => {
      console.error("Logout error:", error);
      alert("Logout failed: " + error.message);
    });
  }
}

// Check if user is admin
function checkAdminAccess() {
  if (!isAdminUser) {
    alert("Access denied. Admin privileges required.");
    window.location.href = 'index.html';
    return false;
  }
  return true;
}

// Redirect to admin panel
function gotoAdminPanel() {
  if (isAdminUser) {
    window.location.href = 'admin.html';
  } else {
    alert("Admin access required.");
  }
            }
