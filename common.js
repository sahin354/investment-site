// --- Global Functions (Define all functions first) ---

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
            const balanceElement = document.getElementById('profileBalance'); 
            if (balanceElement && userData.balance !== undefined) {
                balanceElement.textContent = `₹${userData.balance.toFixed(2)}`;
            }

            // Update balance on 'Recharge' page
            const rechargeBalance = document.getElementById('currentBalanceAmount');
            if (rechargeBalance && userData.balance !== undefined) {
                rechargeBalance.textContent = `₹${userData.balance.toFixed(2)}`;
            }
            
        } else {
            // Create user document if it doesn't exist
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


// --- Session Management Variables ---
const INACTIVITY_TIMEOUT_MS = 1 * 60 * 1000; // 1 Minutes
let inactivityTimer;
let sessionListener = null; // Holds the Firestore unsubscribe function

/**
 * Centralized function to log the user out.
 */
function autoLogout(message) {
    console.log(`Logging out: ${message}`);
    
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
    
    if (eventType) {
        // console.log(`TIMER: Reset by "${eventType}" event.`); // Uncomment for testing
    } else {
        // console.log(`TIMER: Initialized. New logout in 30m`); // Uncomment for testing
    }
    
    inactivityTimer = setTimeout(
        () => {
            // console.log("TIMER: Fired! Logging out now."); // Uncomment for testing
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
    
    const activityHandler = (e) => {
        resetInactivityTimer(e.type); 
    };

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
    const db = (firebase.firestore) ? firebase.firestore() : null;
    if (!db) {
         console.warn("Firestore not available. Single-session feature disabled.");
         return;
    }

    const sessionRef = db.collection('user_sessions').doc(uid);
    let mySessionID = localStorage.getItem('currentSessionID');

    if (!mySessionID) {
        mySessionID = Date.now().toString() + Math.random().toString();
        localStorage.setItem('currentSessionID', mySessionID);
        
        console.log("New login. Setting master session ID in Firestore.");
        sessionRef.set({
            currentSessionID: mySessionID,
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(err => console.error("Could not set session in Firestore:", err));
    }

    stopSessionListener(); 
    
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

// --- Main Auth State Listener ---

function attachAuthListener() {
    if (!firebase || !firebase.auth) {
        console.error("Auth listener not attached: Firebase not ready.");
        return;
    }

    firebase.auth().onAuthStateChanged((user) => {
        const currentPage = window.location.pathname.split('/').pop();
        const authPages = ['login.html', 'register.html', 'verify-email.html']; 
        
        if (user) {
            // --- User is SIGNED IN ---
            console.log('User signed in:', user.uid);
            
            updateUserInfo(user);
            loadUserData(user.uid);
            
            if (authPages.includes(currentPage)) {
                console.log("Redirecting from auth page to index.html");
                window.location.href = 'index.html';
            }

            setupActivityListeners();
            resetInactivityTimer(); // Initial call
            initializeSession(user.uid);

        } else {
            // --- User is SIGNED OUT ---
            console.log('User signed out');
            
            if (!authPages.includes(currentPage)) {
                console.log("Redirecting to login.html");
                window.location.href = 'login.html';
            }

            stopInactivityTimer();
            stopSessionListener();
            localStorage.removeItem('currentSessionID');
        }
    });
}

// --- Sidebar and Logout Button Setup ---

function setupSidebar() {
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
}

function setupLogoutButton() {
    const logoutButton = document.querySelector('.logout-btn'); 
    if (logoutButton && !logoutButton.hasLogoutListener) {
        logoutButton.addEventListener('click', () => {
            console.log("Manual logout. Clearing session...");
            localStorage.removeItem('currentSessionID'); 
            if(firebase && firebase.auth) {
                 firebase.auth().signOut();
            }
        });
        logoutButton.hasLogoutListener = true; 
    }
}


// --- Main App Initialization ---

/**
 * This is the main entry point, called when the DOM is ready.
 */
function initializeApp() {
    console.log("DOM loaded. Initializing app...");
    
    // 1. Setup static UI elements (Sidebar, Logout button)
    // This is safe now because the DOM is loaded.
    setupSidebar(); 
    setupLogoutButton();
    
    // 2. Check for Firebase and set up auth persistence
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log("Auth persistence set to LOCAL");
                // 3. Now that persistence is set, attach the ONE auth listener
                attachAuthListener();
            })
            .catch((error) => {
                console.error('Auth persistence error:', error);
                // Still attach listener even if persistence fails
                attachAuthListener();
            });
    } else {
        console.error("FATAL: Firebase is not loaded. App cannot function.");
        alert("Error: App failed to load. Please try again.");
    }
}

// --- Start the App ---
// This is the only event listener that runs on script load.
// It waits for the HTML to be ready, then calls initializeApp.
document.addEventListener('DOMContentLoaded', initializeApp);
                           
