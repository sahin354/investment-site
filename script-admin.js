auth.onAuthStateChanged(user => {
  if (!user) window.location = 'login.html';
  else {
    db.collection('users').doc(user.uid).get().then(doc=>{
      if (!doc.exists || doc.data().isAdmin !== true) {
        alert("Admin access only."); window.location = 'index.html';
      }
    });
  }
});

function showSection(name) {
  // Hide all sections
  document.querySelectorAll('main.admin-panel section').forEach(s => s.style.display='none');
  document.getElementById(name).style.display='block';
  if(name==='users'){
    db.collection('users').get()
      .then(snap=>{
        let html = "<h3>Users</h3>";
        snap.forEach(doc=>{
          let u=doc.data();
          html+=`<div>User: ${u.name||"-"}, Email: ${u.email||"-"}, Phone: ${u.phone||"-"}, VIP: ${u.vipLevel||"-"} <button onclick="delUser('${doc.id}')">Delete</button></div>`;
        });
        document.getElementById(name).innerHTML=html;
      });
  }
  // Similar for withdraws/recharges/plans
}
function delUser(uid){
  db.collection('users').doc(uid).delete().then(()=>alert("User deleted.")).then(()=>showSection('users'));
}
