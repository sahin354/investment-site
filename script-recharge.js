// Sidebar logic: always working!
document.getElementById('menuBtn').onclick = () => sideMenu.classList.add('open');
document.getElementById('closeBtn').onclick = () => sideMenu.classList.remove('open');
document.getElementById('sidebarSupport').onclick = () => window.open("https://wa.me/1234567890", "_blank");
document.getElementById('sidebarTelegram').onclick = () => window.open("https://t.me/yourtelegramchannel", "_blank");
document.getElementById('sidebarSettings').onclick = () => window.location = 'settings.html';

// Firebase user info
firebase.auth().onAuthStateChanged(user => {
  if(!user) window.location = 'login.html';
  firebase.firestore().collection('users').doc(user.uid).get().then(doc=>{
    const userData = doc.data();
    document.getElementById('sidebarId').textContent = 'ID: ' + (userData?.accountId || user.uid.slice(-5));
    document.getElementById('sidebarVIP').textContent = 'VIP ' + (userData?.vipLevel || '2');
  });
});

// Recharge form handling
document.getElementById('rechargeForm').onsubmit = e => {
  e.preventDefault();
  const amt = +document.getElementById('amount').value;
  if (amt < 100 || amt > 99000) return alert('Amount must be between ₹100 and ₹99000!');
  const channel = document.getElementById('rechargeChannel').value;
  const uid = firebase.auth().currentUser?.uid;
  if(uid) {
    firebase.firestore().collection('recharges').add({uid, amount:amt, channel, timestamp:firebase.firestore.FieldValue.serverTimestamp()})
      .then(()=>document.getElementById('rechargeMessage').textContent="Recharge requested!");
  }
};

document.getElementById('rechargeRecordBtn').onclick = () => {
  const uid = firebase.auth().currentUser?.uid;
  if(uid) {
    firebase.firestore().collection('recharges').where('uid','==',uid).get()
      .then(snap => {
        let msg = snap.empty ? "No recharge records." : "";
        snap.forEach(doc => {
          let d=doc.data();
          msg += `Amount: ₹${d.amount}, Channel: ${d.channel} [${d.timestamp?.toDate().toLocaleString()}]<br>`;
        });
        document.getElementById('rechargeMessage').innerHTML = msg;
      });
  }
};
