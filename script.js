// --- BULLETPROOF SECURITY GATEKEEPER ---
// This is the definitive fix for the auto-logout bug.
// It runs immediately when any page loads.

// Get the name of the current HTML file (e.g., "index.html", "recharge.html")
const currentPage = window.location.pathname.split('/').pop() || 'index.html'; 
const isLoggedIn = localStorage.getItem('loggedIn') === 'true';

// This is a debugging message. You can see it in your browser's console (press F12).
console.log(`Page: ${currentPage}, Logged In: ${isLoggedIn}`);

// The main security rule:
// IF the user is NOT logged in, AND they are NOT trying to access the login or register pages...
if (!isLoggedIn && currentPage !== 'login.html' && currentPage !== 'register.html') {
    
    // ...then redirect them to the login page.
    console.log("Security Check: User is NOT logged in. Redirecting to login.html");
    window.location.href = 'login.html';
}

// --- STANDARD PAGE FUNCTIONALITY ---
// This code only runs after the entire HTML page has finished loading.
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

    // --- Logout Button on Mine Page ---
    const mineLogoutBtn = document.getElementById('mineLogoutBtn');
    if (mineLogoutBtn) {
        mineLogoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('loggedIn');
                window.location.href = "login.html";
            }
        });
    }
});
