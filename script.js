// --- SECURITY GATEKEEPER (THE FIX) ---
// This code now runs first and acts as a gatekeeper for your website.
// It checks if you are logged in. If you are NOT, it sends you to the login page.
// It makes an exception for the login and register pages so you don't get stuck in a loop.
const currentPage = window.location.pathname.split('/').pop();
if (localStorage.getItem('loggedIn') !== 'true' && currentPage !== 'login.html' && currentPage !== 'register.html') {
    window.location.href = 'login.html';
}

// --- PAGE FUNCTIONALITY ---
// This waits for the HTML document to be fully loaded before running.
document.addEventListener('DOMContentLoaded', function() {

    // --- Sidebar Menu Functionality ---
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');

    if (menuBtn && sideMenu && closeBtn) {
        menuBtn.addEventListener('click', () => { sideMenu.style.width = '250px'; });
        closeBtn.addEventListener('click', () => { sideMenu.style.width = '0'; });
    }

    // --- Tab Switching Functionality ---
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

    // --- NEW LOGOUT LOGIC FOR THE MINE PAGE ---
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
