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

menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeBtn.addEventListener('click', () => sideMenu.classList.remove('open'));

auth.onAuthStateChanged(user => {
  const accountId = document.getElementById('accountId');
  const vipLevel = document.getElementById('vipLevel');
  const referralCode = document.getElementById('referralCode');
  const referralStats = document.getElementById('referralStats');

  if (user) {
    accountId.textContent = user.uid;

    db.collection('users').doc(user.uid).get()
      .then(doc => {
        if (doc.exists) {
          vipLevel.textContent = doc.data().vipLevel || 'Standard';
          referralCode.textContent = doc.data().referralCode || 'N/A';
        } else {
          vipLevel.textContent = 'Standard';
          referralCode.textContent = 'N/A';
        }
      });

    // Sample: load referral stats from Firestore collection 'referrals' filtering by user ID
    db.collection('referrals').where('referrerUid', '==', user.uid).get()
      .then(snapshot => {
        if (snapshot.empty) {
          referralStats.innerHTML = '<li>No referrals yet.</li>';
          return;
        }
        let html = '';
        snapshot.forEach(doc => {
          let data = doc.data();
          html += `<li>Referred user: ${data.referredEmail || 'Unknown'}</li>`;
        });
        referralStats.innerHTML = html;
      });
  } else {
    accountId.textContent = 'Guest';
    vipLevel.textContent = 'Guest';
    referralCode.textContent = 'N/A';
    referralStats.innerHTML = '<li>Please sign in to see referral info.</li>';
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
