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
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    button.classList.add('active');
    const tabId = button.getAttribute('data-tab');
    document.getElementById(tabId).classList.add('active');

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

// Load initial tab data on page load
loadTabData('primary');

// Display logged-in user email in sidebar
auth.onAuthStateChanged(user => {
  const userEmailElem = document.getElementById('userEmail');
  if (user) {
    userEmailElem.textContent = user.email;
    console.log('User logged in:', user.email);
  } else {
    userEmailElem.textContent = 'Guest';
    console.log('No user logged in');
    // Optional: redirect to login page if needed
  }
});

// Logout handler
const logoutBtnSidebar = document.getElementById('logoutBtnSidebar');
logoutBtnSidebar.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      alert('Logged out successfully.');
      location.reload();
    })
    .catch(error => {
      alert('Logout error: ' + error.message);
    });
});

// Sidebar buttons placeholders for additional features
document.getElementById('mailBtn').addEventListener('click', () => {
  alert('Mail feature coming soon!');
});
document.getElementById('withdrawalBtn').addEventListener('click', () => {
  alert('Withdrawal feature coming soon!');
});
document.getElementById('rechargeBtn').addEventListener('click', () => {
  alert('Recharge feature coming soon!');
});
document.getElementById('referralBtn').addEventListener('click', () => {
  alert('Referral feature coming soon!');
});
document.getElementById('withdrawalHistoryBtn').addEventListener('click', () => {
  alert('Withdrawal History feature coming soon!');
});
document.getElementById('transactionBtn').addEventListener('click', () => {
  alert('Transaction feature coming soon!');
});
