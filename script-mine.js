const firebaseConfig = {
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

auth.onAuthStateChanged(user => {
  const accountIdElem = document.getElementById('accountId');
  const vipLevelElem = document.getElementById('vipLevel');
  const userEmailElem = document.getElementById('userEmail');
  const userNameElem = document.getElementById('userName');
  const userPhoneElem = document.getElementById('userPhone');
  const transactionList = document.getElementById('transactionList');

  if (user) {
    accountIdElem.textContent = user.uid;
    userEmailElem.textContent = user.email || 'N/A';

    // Fetch user profile from Firestore
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          const data = doc.data();
          vipLevelElem.textContent = data.vipLevel || 'Standard';
          userNameElem.textContent = data.name || 'N/A';
          userPhoneElem.textContent = data.phone || 'N/A';
        } else {
          vipLevelElem.textContent = 'Standard';
          userNameElem.textContent = 'N/A';
          userPhoneElem.textContent = 'N/A';
        }
      })
      .catch(() => {
        vipLevelElem.textContent = 'Standard';
        userNameElem.textContent = 'N/A';
        userPhoneElem.textContent = 'N/A';
      });

    // Fetch transaction history (from 'transactions' collection, filter by user)
    db.collection('transactions').where('uid', '==', user.uid).orderBy('timestamp', 'desc').limit(10).get()
      .then(snapshot => {
        if (snapshot.empty) {
          transactionList.innerHTML = '<li>No transactions found.</li>';
          return;
        }
        let html = '';
        snapshot.forEach(doc => {
          const t = doc.data();
          const date = t.timestamp ? t.timestamp.toDate().toLocaleString() : 'Unknown date';
          html += `<li>
                    <span>${t.type || 'Transaction'}</span>
                    <span>${t.amount ? '₹' + t.amount : '-'}</span>
                    <span>${date}</span>
                  </li>`;
        });
        transactionList.innerHTML = html;
      })
      .catch(() => {
        transactionList.innerHTML = '<li>Error loading transactions.</li>';
      });
  } else {
    accountIdElem.textContent = 'Guest';
    vipLevelElem.textContent = 'Guest';
    userEmailElem.textContent = 'N/A';
    userNameElem.textContent = 'N/A';
    userPhoneElem.textContent = 'N/A';
    transactionList.innerHTML = '<li>Please sign in to see transactions.</li>';
  }
});

document.getElementById('logoutBtnSidebar').addEventListener('click', () => {
  auth.signOut().then(() => {
    alert('Logged out successfully.');
    location.reload();
  }).catch(err => alert('Logout error: ' + err.message));
});
            
