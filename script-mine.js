auth.onAuthStateChanged(user => {
  if(!user) window.location = 'login.html';
  else {
    document.getElementById('sidebarUserId').textContent = user.uid;
    db.collection('users').doc(user.uid).get().then(doc=>{
      const d=doc.data()||{};
      document.getElementById('sidebarVIP').textContent = d.vipLevel || "Standard";
      document.getElementById('userName').textContent = d.name || user.email || 'User';
      document.getElementById('userPhone').textContent = d.phone || '-';
      document.getElementById('rechargeBal').textContent = d.rechargeBalance||'0.00';
      document.getElementById('withdrawBal').textContent = d.withdrawalBalance||'0.00';
    });
    db.collection('withdrawals').where('uid','==',user.uid).get()
      .then(snap => {
        let records = snap.empty ? "No withdrawals." : "";
        snap.forEach(doc => {
          let d=doc.data();
          records += `₹${d.amount} | Status: ${d.status||'Pending'} | ${d.timestamp?.toDate().toLocaleString()}<br>`;
        });
        document.getElementById('withdrawalRecords').innerHTML = records;
      });
    db.collection('transactions').where('uid','==',user.uid).get()
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
  const uid=auth.currentUser?.uid;
  if(uid){
    db.collection('withdrawals').add({uid,amount:amt,tds,netAmount:net,status:'Pending',timestamp:firebase.firestore.FieldValue.serverTimestamp()})
      .then(()=>alert('Withdrawal requested!'));
  }
};
document.getElementById('addBankBtn').onclick = () => alert('Bank Account Add Form Coming Soon!');
document.getElementById('logoutBtnMain').onclick = () => auth.signOut().then(()=>window.location='login.html');
