// --- Firebase Auth State Management ---
// We wrap all auth logic in setPersistence to ensure it runs first.
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("Auth persistence set to LOCAL");
            initializeCommonJs(); // Run all our main code
        })
        .catch((error) => {
            console.error('Auth persistence error:', error);
            // Still try to initialize,
            // but auth state might not be remembered
            initializeCommonJs(); 
        });
} else {
    // Fallback if firebase isn't loaded yet (e.g., on login page)
    // The onAuthStateChanged listener will still be attached inside initializeCommonJs
    // and will run once Firebase does load.
    console.warn("Firebase not loaded immediately. Deferring setup.");
    // We still call initializeCommonJs to set up sidebar listeners
    // and the auth state listener (which will wait for Firebase).
    document.addEventListener('DOMContentLoaded', initializeCommonJs);
}


// --- Global Functions (can be called from anywhere) ---

/**
 * Update user information in sidebar and profile
 */
function updateUserInfo(user) {
    if (!user) return;

    const shortUid = user.uid.substring(0, 10) + '...';
    const userEmail = user.email || 'No email';

    // Update sidebar
    const sidebarId = document.getElementById('sidebarId');
    if (sidebarId) {
        sidebarId.innerHTML = `<div class="sidebar-id">ID: ${shortUid}</div>`;
    }
    
    const sidebarVIP = document.getElementById('sidebarVIP');
    if (sidebarVIP) {
        // This is placeholder, you'd fetch this from Firestore
        sidebarVIP.innerHTML = '<div class="sidebar-vip">VIP Member</div>';
    }
    
    // Update profile page
    const profileId = document.getElementById('profileId');
    if (profileId) {
        profileId.textContent = `ID: ${shortUid}`;
    }
    
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) {
        profileEmail.textContent = userEmail;
    }
}

/**
 * Load additional user data from Firestore
 */
function loadUserData(userId) {
    // Ensure Firestore is available
    if (typeof firebase === 'undefined' || !firebase.firestore) {
        console.error("Firestore not available for loadUserData.");
        return;
    }
    const db = firebase.firestore();
    const userDoc = db.collection('users').doc(userId);
    
    userDoc.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            console.log('User data loaded:', userData);
            
            // Update balance on 'Mine' page
            const balanceElement = document.getElementById('profileBalance'); // Assumes ID from your old code
            if (balanceElement && userData.balance !== undefined) {
                balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
            }

            // Update balance on 'Recharge' page
            const rechargeBalance = document.getElementById('currentBalanceAmount');
            if (rechargeBalance && userData.balance !== undefined) {
                rechargeBalance.textContent = `₹${userData.balance.toFixed(2)}`;
            }
            
            // You can update other elements here (e.g., VIP status)
            // Example:
            // const sidebarVIP = document.getElementById('sidebarVIP');
            // if (sidebarVIP && userData.vipLevel) {
            //    sidebarVIP.innerHTML = `<div class="sidebar-vip">${userData.vipLevel}</div>`;
            // }

        } else {
            // Create user document if it doesn't exist
            console.log("No user document found, creating one...");
            userDoc.set({
                email: firebase.auth().currentUser.email,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                uid: userId
                // Add any other default fields
            }).then(() => {
                console.log('New user document created');
                // Call loadUserData again to populate fields
                loadUserData(userId); 
            }).catch(err => {
                console.error("Error creating user document:", err);
            });
        }
    }).catch((error) => {
        console.error('Error loading user data:', error);
    });
}


// --- Main Initialization Function ---
// This function sets up all listeners for the entire app.
function initializeCommonJs() {

    // --- Check for Firebase Dependencies ---
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.warn("Firebase not fully loaded. Session management features may be disabled.");
    }
    
    const db = (firebase.firestore) ? firebase.firestore() : null;

    // --- Session Management Variables ---
    
    // Inactivity Timer
    // =================================================================
    // === MODIFIED FOR TESTING: Set to 1 Minute (1 * 60 * 1000) ===
    const INACTIVITY_TIMEOUT_MS = 1 * 60 * 1000; // 1 Minute
    // =================================================================
    let inactivityTimer;

    // Single Session
    let sessionListener = null; // Holds the Firestore unsubscribe function


    // --- Session Management Core Functions ---

    /**
     * Centralized function to log the user out.
     * Stops all timers and listeners before signing out.
     */
    function autoLogout(message) {
        console.log(`Logging out: ${message}`);
        
        // Stop all session managers
        stopInactivityTimer();
        stopSessionListener();

        // Clear local session ID on any logout
        localStorage.removeItem('currentSessionID');

        if (firebase && firebase.auth) {
            firebase.auth().signOut()
                .then(() => {
                    alert(message);
                    window.location.href = 'login.html'; // Ensure this is your login page
                })
                .catch((error) => {
                    console.error("Error during auto-logout:", error);
                    alert("Your session has expired.");
                    window.location.href = 'login.html';
                });
        } else {
             alert(message);
             window.location.href = 'login.html';
        }
    }

    // --- Inactivity Timer Functions ---
    
    /**
     * Resets the inactivity timer.
     * @param {string} [eventType] - The name of the event that triggered the reset (e.g., 'mousemove')
     */
    function resetInactivityTimer(eventType) { 
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        // === ENHANCED LOGGING FOR TESTING ===
        if (eventType) {
            console.log(`TIMER: Reset by "${eventType}" event. New logout in ${INACTIVITY_TIMEOUT_MS / 1000}s`);
        } else {
            // This is the first call from onAuthStateChanged
            console.log(`TIMER: Initialized. New logout in ${INACTIVITY_TIMEOUT_MS / 1000}s`);
        }
        
        inactivityTimer = setTimeout(
            () => {
                // === ENHANCED LOGGING FOR TESTING ===
                console.log("TIMER: Fired! Logging out now."); 
                autoLogout("You have been logged out due to inactivity.");
            }, 
            INACTIVITY_TIMEOUT_MS
        );
    }

    function stopInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            console.log("Inactivity timer stopped.");
        }
    }

    function setupActivityListeners() {
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        
        // This function will be the single handler
        const activityHandler = (e) => {
            resetInactivityTimer(e.type); // Pass the event type (e.g., 'mousemove')
        };

        // Clear old listeners first and add new ones
        activityEvents.forEach(eventName => {
             document.removeEventListener(eventName, activityHandler, true);
             document.addEventListener(eventName, activityHandler, true);
        });
        console.log("Activity listeners attached.");
    }
    
    // --- Single Session Management Functions ---
    
    function stopSessionListener() {
        if (sessionListener) {
            sessionListener(); // This unsubscribes from Firestore
            sessionListener = null;
            console.log("Single-session listener stopped.");
        }
    }

    function initializeSession(uid) {
        if (!db) {
             console.warn("Firestore not available. Single-session feature disabled.");
             return;
        }

        const sessionRef = db.collection('user_sessions').doc(uid);
        let mySessionID = localStorage.getItem('currentSessionID');

        if (!mySessionID) {
            // New login for this browser
            mySessionID = Date.now().toString() + Math.random().toString();
            localStorage.setItem('currentSessionID', mySessionID);
            
            console.log("New login. Setting master session ID in Firestore.");
            sessionRef.set({
                currentSessionID: mySessionID,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(err => console.error("Could not set session in Firestore:", err));
        }

        // Attach the listener
        stopSessionListener(); // Stop previous listener
        
        console.log("Attaching session listener...");
        sessionListener = sessionRef.onSnapshot(doc => {
            if (doc.exists) {
                const masterSessionID = doc.data().currentSessionID;
                const localSessionID = localStorage.getItem('currentSessionID');

                if (localSessionID && masterSessionID && localSessionID !== masterSessionID) {
                    console.log("Newer session detected. Logging out this (old) session.");
                    autoLogout("This account was logged in on a new device. You have been logged out.");
                }
            }
        }, error => {
            console.error("Error with session listener:", error);
        });
    }

    // --- Main Auth State Observer (The Single Source of Truth) ---
    if (firebase && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            const currentPage = window.location.pathname.split('/').pop();
            const authPages = ['login.html', 'register.html', 'verify-email.html']; // Add any other auth-related pages
            
            if (user) {
                // --- User is SIGNED IN ---
                console.log('User signed in:', user.uid);
                
                // 1. Update UI
                updateUserInfo(user);
                
                // 2. Load Firestore data
                loadUserData(user.uid);
                
                // 3. Redirect away from auth pages
                if (authPages.includes(currentPage)) {
                    console.log("User logged in, redirecting from auth page to index.html");
                    window.location.href = 'index.html';
                }

                // 4. Start Inactivity Timer
                setupActivityListeners();
                resetInactivityTimer(); // Initial call, no event type
                
                // 5. Start Single-Session Management
                initializeSession(user.uid);

            } else {
                // --- User is SIGNED OUT ---
                console.log('User signed out');
                
                // 1. Redirect to login if not on an auth page
                if (!authPages.includes(currentPage)) {
                    console.log("User signed out, redirecting to login.html");
                    window.location.href = 'login.html';
                }

                // 2. Stop Inactivity Timer
                stopInactivityTimer();
                
                // 3. Stop Single-Session Listener
                stopSessionListener();

                // 4. Clean up local session ID
                localStorage.removeItem('currentSessionID');
            }
        });
    } else {
         console.error("FATAL: Firebase Auth is not loaded. App cannot function.");
         // You might want to show an error to the user here
    }


    // --- DOM Listeners (Run once) ---
    // This listener sets up static elements like the sidebar
    document.addEventListener('DOMContentLoaded', () => {
        
        // Sidebar functionality
        const menuBtn = document.getElementById('menuBtn');
        const closeBtn = document.getElementById('closeBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => document.body.classList.add('sidebar-open'));
        }
        if (closeBtn) {
            closeBtn.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
        }
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
        }

        // Manual Logout Button Handler
        // Finds any button with class 'logout-btn' (like on mine.html)
        const logoutButton = document.querySelector('.logout-btn'); 
        if (logoutButton) {
            // Check if a listener is already attached, to be safe
            if (!logoutButton.hasLogoutListener) {
                logoutButton.addEventListener('click', () => {
                    console.log("Manual logout. Clearing session and signing out.");
                    
                    // Manually clear local session first
                    localStorage.removeItem('currentSessionID'); 
                    
                    // Then sign out, which will trigger the onAuthStateChanged listener
                    if(firebase && firebase.auth) {
                         firebase.auth().signOut();
                    }
                });
                logoutButton.hasLogoutListener = true; // Flag to prevent multiple listeners
            }
        }
        
    }); // End DOMContentLoaded

} // End initializeCommonJs
            
