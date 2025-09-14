// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Sidebar toggle
const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');

menuBtn.addEventListener('click', () => {
  sideMenu.classList.add('open');
});

closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('open');
});

// Tabs switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    // Remove active class from all buttons and contents
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // Activate current tab and content
    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

    // Load data for active tab
    loadTabData(tabId);
  });
});

// Load Firestore data for tabs
function loadTabData(tabName) {
  const container = document.getElementById(tabName);
  container.innerHTML = '<p>Loading...</p>';

  db.collection(tabName)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        container.innerHTML = '<p>No data available.</p>';
        return;
      }

      let html = '<ul>';
      snapshot.forEach(doc => {
        const data = doc.data();
        html += `<li><strong>${data.title || 'Untitled'}</strong>: ${data.description || ''}</li>`;
      });
      html += '</ul>';
      container.innerHTML = html;
    })
    .catch(error => {
      container.innerHTML = `<p>Error loading data: ${error.message}</p>`;
    });
}

// Load initial tab data
loadTabData('primary');

// Authentication UI
const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');

logoutBtnSidebar.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      alert('Logged out successfully.');
      // Optionally redirect to login or reload
      location.reload();
    })
    .catch(error => {
      alert('Logout error: ' + error.message);
    });
});

// Monitor auth state
auth.onAuthStateChanged(user => {
  if (user) {
    console.log('User logged in:', user.email);
  } else {
    console.log('No user logged in');
    // Optionally redirect to login page
  }
});
