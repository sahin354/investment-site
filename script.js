// Wait for the document to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

  // --- Sidebar Menu Functionality ---
  const sideMenu = document.getElementById('sideMenu');
  const menuBtn = document.getElementById('menuBtn');
  const closeBtn = document.getElementById('closeBtn');

  // Open the menu
  if (menuBtn) {
    menuBtn.addEventListener('click', function() {
      sideMenu.style.width = '250px';
    });
  }

  // Close the menu
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      sideMenu.style.width = '0';
    });
  }

  // --- Tab Switching Functionality ---
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Get the target tab from the data-tab attribute
      const tabId = button.getAttribute('data-tab');
      
      // Remove 'active' class from all buttons and content
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Add 'active' class to the clicked button and corresponding content
      button.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // --- Logout Functionality ---
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(event) {
      event.preventDefault(); // Prevent the link from navigating
      
      // Optional: Add a confirmation dialog
      const isConfirmed = confirm('Are you sure you want to logout?');
      
      if (isConfirmed) {
        // Clear user session data from localStorage
        localStorage.removeItem("loggedIn"); 
        
        // Redirect to the login page
        window.location.href = "login.html"; 
        console.log("Logging out...");
      }
    });
  }

});
