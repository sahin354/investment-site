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
    console.warn("Firebase not loaded immediately. Deferring setup.");
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
    if (sidebarId) sidebarId.innerHTML = `<div class="sidebar-id">ID: ${shortUid}</div>`;
    const sidebarVIP = document.getElementById('sidebarVIP');
    if (sidebarVIP) sidebarVIP.innerHTML = '<div class="sidebar-vip">VIP Member</div>';
    
    // Update profile page
    const profileId = document.getElementById('profileId');
    if (profileId) profileId.textContent = `ID: ${shortUid}`;
    const profileEmail = document.getElementById('profileEmail');
    if (profileEmail) profileEmail.textContent = userEmail;
}

/**
 * Load additional user data from Firestore
 */
function loadUserData(userId) {
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
            
            const balanceElement = document.getElementById('profileBalance'); 
            if (balanceElement && userData.balance !== undefined) {
                balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
            }
            const rechargeBalance = document.getElementById('currentBalanceAmount');
            if (rechargeBalance && userData.balance !== undefined) {
                rechargeBalance.textContent = `₹${userData.balance.toFixed(2)}`;
            }
        } else {
            console.log("No user document found, creating one...");
            userDoc.set({
                email: firebase.auth().currentUser.email,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                uid: userId
            }).then(() => {
                console.log('New user document created');
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
function initializeCommonJs() {

    // --- START: On-Screen Debugger for Mobile ---
    let debugElement = null;
    let lastMoveLog = 0; // To prevent "mousemove" flooding

    /**
     * Creates or finds the on-screen debug element.
     */
    function setupDebugger() {
        if (document.getElementById('mobileDebugger')) {
            debugElement = document.getElementById('mobileDebugger');
            return;
        }
        
        debugElement = document.createElement('div');
        debugElement.id = 'mobileDebugger';
        
        // Style it to be visible on top of everything
        debugElement.style.position = 'fixed';
        debugElement.style.bottom = '75px'; // Above the 70px bottom-nav-spacer
        debugElement.style.left = '5px';
        debugElement.style.right = '5px';
        debugElement.style.padding = '8px';
        debugElement.style.background = 'rgba(255, 255, 100, 0.9)'; // Bright yellow
        debugElement.style.color = 'black';
        debugElement.style.border = '1px solid black';
        debugElement.style.borderRadius = '5px';
        debugElement.style.zIndex = '9999';
        debugElement.style.fontSize = '12px';
        debugElement.style.fontFamily = 'monospace';
        debugElement.style.wordBreak = 'break-all';
        
        document.body.appendChild(debugElement);
        debugElement.innerHTML = 'Debugger Initialized...';
    }

    /**
     * Updates the text of the on-screen debug element.
     * @param {string} message - The message to display.
     */
    function updateDebugInfo(message) {
        if (!debugElement) {
            setupDebugger();
        }

        // Throttle "mousemove" to prevent unreadable flooding
        if (message.includes("mousemove")) {
            const now = Date.now();
            if (now - lastMoveLog < 1000) { // Only log mousemove once per second
                return; 
            }
            lastMoveLog = now;
        }
        debugElement.textContent = message;
    }
    // --- END: On-Screen Debugger ---


    // --- Check for Firebase Dependencies ---
    if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
        console.warn("Firebase not fully loaded.");
    }
    
    const db = (firebase.firestore) ? firebase.firestore() : null;

    // --- Session Management Variables ---
    
    // =================================================================
    // === MODIFIED FOR TESTING: Set to 1 Minute (1 * 60 * 1000) ===
    const INACTIVITY_TIMEOUT_MS = 1 * 60 * 1000; // 1 Minute
    // =================================================================
    let inactivityTimer;

    let sessionListener = null; 

    // --- Session Management Core Functions ---

    function autoLogout(message) {
        updateDebugInfo(`Logging out: ${message}`);
        
        stopInactivityTimer();
        stopSessionListener();
        localStorage.removeItem('currentSessionID');

        if (firebase && firebase.auth) {
            firebase.auth().signOut()
                .then(() => {
                    alert(message);
                    window.location.href = 'login.html'; 
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
    
    function resetInactivityTimer(eventType) { 
        if (inactivityTimer) clearTimeout(inactivityTimer);
        
        const message = eventType ? 
            `TIMER: Reset by "${eventType}". New logout in ${INACTIVITY_TIMEOUT_MS / 1000}s` : 
            `TIMER: Initialized. New logout in ${INACTIVITY_TIMEOUT_MS / 1000}s`;
        updateDebugInfo(message);
        
        inactivityTimer = setTimeout(
            () => {
                updateDebugInfo("TIMER: Fired! Logging out now."); 
                autoLogout("You have been logged out due to inactivity.");
            }, 
            INACTIVITY_TIMEOUT_MS
        );
    }

    function stopInactivityTimer() {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
            updateDebugInfo("Inactivity timer stopped.");
        }
    }

    function setupActivityListeners() {
        const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
        
        const activityHandler = (e) => {
            resetInactivityTimer(e.type); 
        };

        activityEvents.forEach(eventName => {
             document.removeEventListener(eventName, activityHandler, true);
             document.addEventListener(eventName, activityHandler, true);
        });
        updateDebugInfo("Activity listeners attached.");
    }
    
    // --- Single Session Management Functions ---
    
    function stopSessionListener() {
        if (sessionListener) {
            sessionListener(); 
            sessionListener = null;
            updateDebugInfo("Single-session listener stopped.");
        }
    }

    function initializeSession(uid) {
        if (!db) {
             updateDebugInfo("Firestore not available. Single-session feature disabled.");
             return;
        }

        const sessionRef = db..collection('user_sessions').doc(uid);
        let mySessionID = localStorage.getItem('currentSessionID');

        if (!mySessionID) {
            mySessionID = Date.now().toString() + Math.random().toString();
            localStorage.setItem('currentSessionID', mySessionID);
            
            updateDebugInfo("New login. Setting master session ID in Firestore.");
            sessionRef.set({
                currentSessionID: mySessionID,
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
            }).catch(err => console.error("Could not set session in Firestore:", err));
        }

        stopSessionListener(); 
        
        updateDebugInfo("Attaching session listener...");
        sessionListener = sessionRef.onSnapshot(doc => {
            if (doc.exists) {
                const masterSessionID = doc.data().currentSessionID;
                const localSessionID = localStorage.getItem('currentSessionID');

                if (localSessionID && masterSessionID && localSessionID !== masterSessionID) {
                    updateDebugInfo("Newer session detected. Logging out this (old) session.");
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
            // We need the debugger to run *before* any redirects
            // So we set it up here, inside the auth listener
            document.addEventListener('DOMContentLoaded', setupDebugger);

            const currentPage = window.location.pathname.split('/').pop();
            const authPages = ['login.html', 'register.html', 'verify-email.html']; 
            
            if (user) {
                // --- User is SIGNED IN ---
                updateDebugInfo(`User signed in: ${user.uid.substring(0, 5)}...`);
                
                updateUserInfo(user);
                loadUserData(user.uid);
                
                if (authPages.includes(currentPage)) {
                    updateDebugInfo("Redirecting from auth page to index.html");
                    window.location.href = 'index.html';
                }

                setupActivityListeners();
                resetInactivityTimer(); // Initial call
                initializeSession(user.uid);

            } else {
                // --- User is SIGNED OUT ---
                updateDebugInfo("User signed out.");
                
                if (!authPages.includes(currentPage)) {
                    updateDebugInfo("Redirecting to login.html");
                    window.location.href = 'login.html';
                }

                stopInactivityTimer();
                stopSessionListener();
                localStorage.removeItem('currentSessionID');
            }
        });
    } else {
         console.error("FATAL: Firebase Auth is not loaded. App cannot function.");
         // We can't use the debugger if the page hasn't loaded,
         // but we can try an alert.
         alert("FATAL: Firebase Auth is not loaded.");
    }

    // --- Static DOM Listeners (Sidebar, Logout Button) ---
    document.addEventListener('DOMContentLoaded', () => {
        
        // Setup debugger just in case auth hasn't run yet
        setupDebugger();

        // Sidebar
        const menuBtn = document.getElementById('menuBtn');
        const closeBtn = document.getElementById('closeBtn');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (menuBtn) menuBtn.addEventListener('click', () => document.body.classList.add('sidebar-open'));
        if (closeBtn) closeBtn.addEventListener('click', () => document.body.classList.remove('sidebar-open'));
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', () => document.body.classList.remove('sidebar-open'));

        // Manual Logout Button
        const logoutButton = document.querySelector('.logout-btn'); 
        if (logoutButton && !logoutButton.hasLogoutListener) {
            logoutButton.addEventListener('click', () => {
                updateDebugInfo("Manual logout. Clearing session...");
                localStorage.removeItem('currentSessionID'); 
                if(firebase && firebase.auth) {
                     firebase.auth().signOut();
                }
            });
            logoutButton.hasLogoutListener = true; 
        }
        
    }); // End DOMContentLoaded

} // End initializeCommonJs
