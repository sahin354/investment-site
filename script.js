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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const menuBtn = document.getElementById('menuBtn');
const sideMenu = document.getElementById('sideMenu');
const closeBtn = document.getElementById('closeBtn');

menuBtn.addEventListener('click', () => {
  sideMenu.classList.add('open');
});

closeBtn.addEventListener('click', () => {
  sideMenu.classList.remove('open');
});

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

loadTabData('primary');

auth.onAuthStateChanged(user => {
  const accountId = document.getElementById('accountId');
  const vipLevel = document.getElementById('vipLevel');
  if (user) {
    accountId.textContent = user.uid;

    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          vipLevel.textContent = doc.data().vipLevel || 'Standard';
        } else {
          vipLevel.textContent = 'Standard';
        }
      })
      .catch(() => {
        vipLevel.textContent = 'Standard';
      });
  } else {
    accountId.textContent = 'Guest';
    vipLevel.textContent = 'Guest';
  }
});

document.getElementById('logoutBtnSidebar').addEventListener('click', () => {
  auth.signOut().then(() => {
    alert('Logged out successfully.');
    location.reload();
  }).catch(err => {
    alert('Logout error: ' + err.message);
  });
});
      
