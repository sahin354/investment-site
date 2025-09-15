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

document.getElementById('menuBtn').onclick = () => sideMenu.classList.add('open');
document.getElementById('closeBtn').onclick = () => sideMenu.classList.remove('open');
document.getElementById('sidebarSupport').onclick = () => window.open("https://yourcustomersupporturl", "_blank");
document.getElementById('sidebarTelegram').onclick = () => window.open("https://t.me/yourtelegramchannel", "_blank");
firebase.auth().onAuthStateChanged(user => {
  if(!user) window.location = 'login.html';
  else {
    document.getElementById('sidebarUserId').textContent = user.uid;
    firebase.firestore().collection('users').doc(user.uid).get()
      .then(doc => {
        const d=doc.data()||{};
        document.getElementById('sidebarVIP').textContent = d.vipLevel || "Standard";
        document.getElementById('userName').textContent = d.name || user.email || 'User';
        document.getElementById('userPhone').textContent = d.phone || '-';
        document.getElementById('rechargeBal').textContent = d.rechargeBalance||'0.00';
        document.getElementById('withdrawBal').textContent = d.withdrawalBalance||'0.00';
      });
    // Withdrawal records
    firebase.firestore().collection('withdrawals').where('uid','==',user.uid).get()
      .then(snap => {
        let records = snap.empty ? "No withdrawals." : "";
        snap.forEach(doc => {
          let d=doc.data();
          records += `₹${d.amount} | Status: ${d.status||'Pending'} | ${d.timestamp?.toDate().toLocaleString()}<br>`;
        });
        document.getElementById('withdrawalRecords').innerHTML = records;
      });
    // Transactions
    firebase.firestore().collection('transactions').where('uid','==',user.uid).get()
      .then(snap => {
        let records = snap.empty ? "No transactions." : "";
        snap.forEach(doc => {
          let d=doc.data();
          records += `${d.type||'Txn'}: ₹${d.amount||'-'} | ${d.timestamp?.toDate().toLocaleString()}<br>`;
        });
        document.getElementById('transactionList').innerHTML = records;
      });
  }
});
document.getElementById('withdrawForm').onsubmit = e => {
  e.preventDefault();
  const amt = +document.getElementById('withdrawAmt').value;
  if(amt<119||amt>50000) return alert('Invalid amount!');
  const tds = Math.round(amt*.19);
  const net = amt-tds;
  alert(`₹${tds} TDS deducted. Net: ₹${net}`);
  const uid=firebase.auth().currentUser?.uid;
  if(uid){
    firebase.firestore().collection('withdrawals').add({
      uid,amount:amt,tds,netAmount:net,status:'Pending',timestamp:firebase.firestore.FieldValue.serverTimestamp()
    }).then(()=>alert('Withdrawal requested!'));
  }
};
document.getElementById('addBankBtn').onclick = () => alert('Bank Account Add Form Coming Soon!');
document.getElementById('logoutBtnMain').onclick = () => firebase.auth().signOut().then(()=>window.location='login.html');
