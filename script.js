auth.onAuthStateChanged(user => {
  if (!user) window.location = 'login.html';
  document.getElementById('sidebarUserId').textContent = user.uid;
  db.collection('users').doc(user.uid).get().then(doc => {
    document.getElementById('sidebarVIP').textContent = doc.data()?.vipLevel || 'Standard';
  });
});
document.getElementById('menuBtn').onclick = () => sideMenu.classList.add('open');
document.getElementById('closeBtn').onclick = () => sideMenu.classList.remove('open');
document.getElementById('sidebarSupport').onclick = () => window.open("https://yourcustomersupporturl", "_blank");
document.getElementById('sidebarTelegram').onclick = () => window.open("https://t.me/yourtelegramchannel", "_blank");

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(button => {
  button.onclick = () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
    loadTabData(button.dataset.tab);
  }
});
function loadTabData(tabName) {
  const container = document.getElementById(tabName);
  container.innerHTML = '<p>Loading...</p>';
  db.collection(tabName).get().then(snap => {
    if (snap.empty) return container.innerHTML = '<p>No data.</p>';
    let html = '<ul>';
    snap.forEach(doc => {
      let d = doc.data();
      html += `<li><b>${d.title||'Item'}</b>: ${d.description||''}</li>`;
    });
    html += '</ul>';
    container.innerHTML = html;
  });
}
loadTabData('primary');
