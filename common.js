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
                    window.location.href = 'login.html';
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
