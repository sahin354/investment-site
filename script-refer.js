auth.onAuthStateChanged(user => {
  if(!user) window.location = 'login.html';
  else {
    document.getElementById('sidebarUserId').textContent = user.uid;
    db.collection('users').doc(user.uid).get().then(doc=>{
      document.getElementById('sidebarVIP').textContent = doc.data()?.vipLevel || "Standard";
    });
    const link = location.origin + "/register.html?ref=" + user.uid;
    document.getElementById('referLink').value = link;
    document.getElementById('copyReferLink').onclick = () => navigator.clipboard.writeText(link);
    db.collection('referrals').where('referrerUid','==',user.uid).get()
      .then(snap => document.getElementById('referUserCount').textContent = "Users Referred: " + snap.size);
  }
});
