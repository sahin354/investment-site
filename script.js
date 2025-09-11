// --- GATEKEEPER SCRIPT ---
// This should be the very first thing in your script.js
// It checks if the user is logged in. If not, it redirects them to login.html.
if (localStorage.getItem('loggedIn') !== 'true') {
  // Check if we are NOT already on the login or register page to avoid a redirect loop
  if (window.location.pathname.indexOf('login.html') === -1 && window.location.pathname.indexOf('register.html') === -1) {
    window.location.href = 'login.html';
  }
}
// --- END GATEKEEPER SCRIPT ---


// Wait for the document to be fully loaded before running the rest of the script
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

  // --- Logout Functionality (for sidebar in index.html) ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault();
      
      if (confirm('Are you sure you want to logout?')) {
        // REMOVE the loggedIn flag
        localStorage.removeItem('loggedIn'); 
        // Redirect to the login page
        window.location.href = "login.html";
      }
    });
  }

});
