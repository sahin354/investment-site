auth.onAuthStateChanged(user => {
  if(!user) window.location = 'login.html';
  else {
    document.getElementById('sidebarUserId').textContent = user.uid;
    db.collection('users').doc(user.uid).get().then(doc=>{
      document.getElementById('sidebarVIP').textContent = doc.data()?.vipLevel || "Standard";
    });
  }
});
document.getElementById('rechargeForm').onsubmit = e => {
  e.preventDefault();
  const amt = +document.getElementById('amount').value;
  if(amt < 100 || amt > 99000) return alert('Invalid amount!');
  const channel = document.getElementById('rechargeChannel').value;
  const uid = auth.currentUser?.uid;
  if(uid) {
    db.collection('recharges').add({uid, amount:amt, channel, timestamp:firebase.firestore.FieldValue.serverTimestamp()})
      .then(()=>document.getElementById('rechargeMessage').textContent="Recharge submitted!");
  }
};
document.getElementById('rechargeRecordBtn').onclick = () => {
  const uid = auth.currentUser?.uid;
  if(uid) {
    db.collection('recharges').where('uid','==',uid).get()
      .then(snap => {
        let msg = snap.empty ? "No records." : "";
        snap.forEach(doc => {
          let d=doc.data();
          msg += `Amount: ₹${d.amount}, Channel: ${d.channel} [${d.timestamp?.toDate().toLocaleString()}]<br>`;
        });
        document.getElementById('rechargeMessage').innerHTML = msg;
      });
  }
};
