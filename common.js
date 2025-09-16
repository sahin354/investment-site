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
