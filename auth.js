document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  // Handle Login
  if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
      event.preventDefault(); // Prevent the form from submitting normally
      
      // In a real app, you would verify credentials with a server.
      // Here, we'll just simulate a successful login.
      console.log('Login attempt');

      // Set a flag in localStorage to indicate the user is logged in
      localStorage.setItem('loggedIn', 'true');

      // Redirect to the main page
      window.location.href = 'index.html';
    });
  }

  // Handle Registration
  if (registerForm) {
    registerForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (password !== confirmPassword) {
        alert("Passwords do not match. Please try again.");
        return; // Stop the function
      }

      // In a real app, you would send this data to a server to create an account.
      // Here, we'll simulate a successful registration.
      console.log('Registration attempt');

      // Set the loggedIn flag upon successful registration
      localStorage.setItem('loggedIn', 'true');

      // Redirect to the main page
      window.location.href = 'index.html';
    });
  }
});
