firebase.auth().onAuthStateChanged(user => {
  if (!user) window.location = 'login.html';
  // You must add an admin check e.g., a field in user doc {isAdmin:true}
});

function showSection(name) {
  document.querySelectorAll('main.admin-panel section').forEach(s => s.style.display='none');
  document.getElementById(name).style.display='block';
  if(name==='users'){
    firebase.firestore().collection('users').get()
      .then(snap=>{
        let html = "<h3>Users</h3>";
        snap.forEach(doc=>{
          let u=doc.data();
          html+=`<div>User: ${u.name||"-"}, Email: ${u.email||"-"}, Phone: ${u.phone||"-"}, VIP: ${u.vipLevel||"-"} <button onclick="delUser('${doc.id}')">Delete</button></div>`;
        });
        document.getElementById(name).innerHTML=html;
      });
  }
  // Do similar for withdraws, recharges, plans
}
function delUser(uid){ 
  firebase.firestore().collection('users').doc(uid).delete().then(()=>alert("User deleted.")).then(()=>showSection('users')); 
}
