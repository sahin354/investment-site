// Wait for the document to be fully loaded before running the script
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
        localStorage.removeItem("loggedIn"); 
        window.location.href = "login.html";
      }
    });
  }

});
