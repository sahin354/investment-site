// --- SECURITY GATEKEEPER ---
// This check runs immediately on any page that includes this script.
// It ensures that if a user is not logged in, they are sent back to the login page.
// The exception is if they are already on the login or register page.
const currentPage = window.location.pathname.split('/').pop();
if (localStorage.getItem('loggedIn') !== 'true' && currentPage !== 'login.html' && currentPage !== 'register.html') {
    window.location.href = 'login.html';
}


// --- PAGE FUNCTIONALITY ---
// This waits for the HTML document to be fully loaded before trying to find elements.
document.addEventListener('DOMContentLoaded', function() {

    // --- Sidebar Menu Functionality (for index.html) ---
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');

    if (menuBtn && sideMenu && closeBtn) {
        menuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
        closeBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }

    // --- Tab Switching Functionality (for index.html) ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    if (tabButtons.length > 0) {
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabId = button.getAttribute('data-tab');
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));

                button.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }

    // --- LOGOUT FUNCTIONALITY ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (event) => {
            event.preventDefault(); 
            
            // Optional: ask for confirmation
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('loggedIn'); 
                // We don't need to sign out from Firebase Auth here for this simple system
                window.location.href = "login.html";
            }
        });
    }

});
