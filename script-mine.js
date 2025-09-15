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

menuBtn.addEventListener('click', () => sideMenu.classList.add('open'));
closeBtn.addEventListener('click', () => sideMenu.classList.remove('open'));

auth.onAuthStateChanged(user => {
  const accountIdElem = document.getElementById('accountId');
  const vipLevelElem = document.getElementById('vipLevel');
  const userNameElem = document.getElementById('userName');
  if (user) {
    accountIdElem.textContent = "ID: " + user.uid;
    db.collection('users').doc(user.uid).get()
      .then(doc => {
        const d = doc.exists ? doc.data() : {};
        vipLevelElem.textContent = "VIP: " + (d.vipLevel || '-');
        userNameElem.textContent = d.name || user.email || 'User';
      });
  } else {
    accountIdElem.textContent = 'ID: Guest';
    vipLevelElem.textContent = 'VIP: -';
    userNameElem.textContent = 'Guest';
  }
});

// Button stubs
document.getElementById('rechargeBtnMain').onclick = () => window.location = 'recharge.html';
document.getElementById('withdrawBtn').onclick = () => alert('Withdrawal functionality coming soon!');
document.getElementById('teamBtn').onclick = () => alert('Team functionality coming soon!');
document.getElementById('bankCardBtn').onclick = () => alert('Bank Card functionality coming soon!');
document.getElementById('withdrawalRecordsBtn').onclick = () => alert('Withdrawal Records coming soon!');
document.getElementById('balanceDetailsBtn').onclick = () => alert('Balance Details coming soon!');
document.getElementById('depositRecordsBtn').onclick = () => alert('Deposit Records coming soon!');
document.getElementById('customerServiceBtn').onclick = () => window.open('https://t.me/yourcustomerservice', '_blank');
document.getElementById('telegramBtn').onclick = () => window.open('https://t.me/yourtelegramchannel', '_blank');
document.getElementById('accountBtn').onclick = () => alert('Account management coming soon!');
document.getElementById('settingsBtn').onclick = () => window.location = 'settings.html';

document.getElementById('logoutBtnSidebar').onclick =
document.getElementById('logoutBtnMain').onclick = function() {
  auth.signOut().then(() => {
    alert('Logged out successfully.');
    location.reload();
  }).catch(err => alert('Logout error: ' + err.message));
}
