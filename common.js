document.addEventListener('DOMContentLoaded', () => {
    // --- Sidebar Functionality ---
    const menuBtn = document.getElementById('menuBtn');
    const sideMenu = document.getElementById('sideMenu');
    const closeBtn = document.getElementById('closeBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const openSidebar = () => {
        document.body.classList.add('sidebar-open');
    };

    const closeSidebar = () => {
        document.body.classList.remove('sidebar-open');
    };

    if (menuBtn && sideMenu && closeBtn && sidebarOverlay) {
        menuBtn.addEventListener('click', openSidebar);
        closeBtn.addEventListener('click', closeSidebar);
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // --- Firebase User Data for Sidebar ---
    const sidebarIdEl = document.getElementById('sidebarId');
    const sidebarVIPEl = document.getElementById('sidebarVIP');

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            const db = firebase.firestore();
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (sidebarIdEl) {
                        sidebarIdEl.textContent = `ID: ${userData.userId || 'N/A'}`; // Assuming you have a shorter userId field
                    }
                    if (sidebarVIPEl) {
                        sidebarVIPEl.textContent = `VIP ${userData.vipLevel || 0}`;
                    }
                }
            }).catch(error => {
                console.error("Error fetching user data for sidebar:", error);
            });
        } else {
            // No user is signed in.
            // On pages that require auth, the page-specific script should handle the redirect.
            console.log("No user signed in.");
        }
    });
});

// Enhanced authentication state management
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        // Auth state observer
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                // User is signed in
                console.log('User is signed in:', user.uid);
                updateSidebarUserInfo(user);
            } else {
                // User is signed out
                console.log('User is signed out');
                // Only redirect if not on auth pages
                if (!window.location.pathname.includes('login.html') && 
                    !window.location.pathname.includes('register.html') &&
                    !window.location.pathname.includes('verify-email.html')) {
                    window.location.href = 'login.html';
                }
            }
        });
    })
    .catch((error) => {
        console.error('Auth persistence error:', error);
    });

function updateSidebarUserInfo(user) {
    // Update sidebar with user info
    const sidebarId = document.getElementById('sidebarId');
    const sidebarVIP = document.getElementById('sidebarVIP');
    
    if (sidebarId) {
        sidebarId.textContent = `ID: ${user.uid.substring(0, 8)}...`;
    }
    if (sidebarVIP) {
        sidebarVIP.textContent = 'VIP Member';
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
});
