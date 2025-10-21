// Firebase Auth State Management
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Auth persistence set to LOCAL");
        
        // Auth state observer
        firebase.auth().onAuthStateChanged((user) => {
            const currentPage = window.location.pathname.split('/').pop();
            const authPages = ['login.html', 'register.html', 'verify-email.html'];
            
            if (user) {
                // User is signed in
                console.log('User signed in:', user.uid);
                updateUserInfo(user);
                
                // Redirect away from auth pages if already logged in
                if (authPages.includes(currentPage)) {
                    window.location.href = 'index.html';
                }
            } else {
                // User is signed out
                console.log('User signed out');
                
                // Redirect to login if not on auth pages
                if (!authPages.includes(currentPage)) {
                    window.location.href = 'login.html'
                }
            }
        });
    })
    .catch((error) => {
        console.error('Auth persistence error:', error);
    });

// Update user information in sidebar and profile
function updateUserInfo(user) {
    // Update sidebar
    const sidebarId = document.getElementById('sidebarId');
    const sidebarVIP = document.getElementById('sidebarVIP');
    
    if (sidebarId) {
        sidebarId.innerHTML = `<div class="sidebar-id">ID: ${user.uid.substring(0, 10)}...</div>`;
    }
    if (sidebarVIP) {
        sidebarVIP.innerHTML = '<div class="sidebar-vip">VIP Member</div>';
    }
    
    // Update profile page
    const profileId = document.getElementById('profileId');
    const profileEmail = document.getElementById('profileEmail');
    
    if (profileId) {
        profileId.textContent = `ID: ${user.uid.substring(0, 10)}...`;
    }
    if (profileEmail) {
        profileEmail.textContent = user.email || 'No email';
    }
}

// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sideMenu = document.getElementById('sideMenu');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            document.body.classList.add('sidebar-open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.body.classList.remove('sidebar-open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            document.body.classList.remove('sidebar-open');
        });
    }
    
    // Initialize user data if user is logged in
    const user = firebase.auth().currentUser;
    if (user) {
        updateUserInfo(user);
        loadUserData(user.uid);
    }
});

// Load additional user data from Firestore
function loadUserData(userId) {
    const userDoc = firebase.firestore().collection('users').doc(userId);
    
    userDoc.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            // Update balance
            const balanceElement = document.getElementById('profileBalance');
            if (balanceElement && userData.balance !== undefined) {
                balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
            }
            
            // Update other user data as needed
            console.log('User data loaded:', userData);
        } else {
            // Create user document if it doesn't exist
            userDoc.set({
                email: firebase.auth().currentUser.email,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                console.log('New user document created');
            });
        }
    }).catch((error) => {
        console.error('Error loading user data:', error);
    });
                    }

// --- START: Inactivity Auto-Logout ---
// This code should be added to your common.js file

document.addEventListener('DOMContentLoaded', () => {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined' || !firebase.auth) {
        console.warn("Firebase Auth not found, auto-logout feature is disabled.");
        return;
    }

    // Set the inactivity timeout duration (30 minutes in milliseconds)
    const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

    // Variable to hold the timer ID
    let inactivityTimer;

    /**
     * Function to log the user out via Firebase and redirect.
     */
    function autoLogout() {
        console.log("Inactivity detected. Logging out...");
        
        firebase.auth().signOut()
            .then(() => {
                // Sign-out successful.
                alert("You have been logged out due to inactivity.");
                
                // --- IMPORTANT ---
                // Change 'login.html' to the correct path of your login page if it's different.
                window.location.href = 'login.html'; 
            })
            .catch((error) => {
                // An error happened.
                console.error("Error during auto-logout:", error);
                
                // Still redirect even if sign-out fails, as session might be bad
                alert("Your session has expired.");
                window.location.href = 'login.html';
            });
    }

    /**
     * Resets the inactivity timer.
     * This function is called whenever user activity is detected.
     */
    function resetInactivityTimer() {
        // Clear the existing timer
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }
        
        // Start a new timer
        inactivityTimer = setTimeout(autoLogout, INACTIVITY_TIMEOUT_MS);
        // console.log("Timer reset. New timeout in 30 minutes."); // Uncomment for testing
    }

    /**
     * Stops the inactivity timer.
     * Used when the user logs out manually or is not logged in.
     */
    function stopInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            console.log("Inactivity timer stopped.");
        }
    }

    /**
     * Attaches event listeners to the document to detect activity.
     */
    function setupActivityListeners() {
        // Events that count as user activity
        const activityEvents = [
            'mousemove', 
            'mousedown', 
            'keydown', 
            'touchstart', 
            'scroll',
            'click'
        ];

        // Add event listeners for all activity events
        // We use 'document' to listen globally
        activityEvents.forEach(eventName => {
            document.addEventListener(eventName, resetInactivityTimer, true);
        });

        console.log("Activity listeners attached.");
    }

    // --- Main Logic ---
    // Use onAuthStateChanged to check if a user is logged in.
    // We only want the timer to run for logged-in users.
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in.
            console.log("User is logged in. Starting inactivity timer.");
            setupActivityListeners(); // Start listening for activity
            resetInactivityTimer(); // Start the timer for the first time
        } else {
            // User is signed out (or was never logged in).
            console.log("User is not logged in. Stopping inactivity timer.");
            stopInactivityTimer(); // Stop any existing timer
            
            // Optional: Remove listeners if you want to be extra clean,
            // but it's generally fine to leave them.
        }
    });

});

// --- END: Inactivity Auto-Logout ---

