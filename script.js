// --- GATEKEEPER SCRIPT ---
// This checks if the user is logged in. If not, it redirects them to login.html.
if (localStorage.getItem('loggedIn') !== 'true') {
  // Allow access only to login and register pages if not logged in
  if (window.location.pathname.indexOf('login.html') === -1 && window.location.pathname.indexOf('register.html') === -1) {
    window.location.href = 'login.html';
  }
}
// --- END GATEKEEPER SCRIPT ---

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

   // --- LOGOUT FUNCTIONALITY ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
      event.preventDefault(); 
      
      if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('loggedIn'); 
        window.location.href = "login.html";
      }
    });
  }
  // --- END OF LOGOUT FUNCTIONALITY ---


});

// --- LOGIN STATE TOGGLE FOR LOGOUT BUTTON ---
document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const loggedIn = localStorage.getItem("isLoggedIn") === "true";

    // Show logout if logged in, otherwise hide
    logoutBtn.style.display = loggedIn ? "block" : "none";

    // Logout click handler
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("isLoggedIn");
      window.location.reload();
    });
  }
});


