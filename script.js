// SIDEBAR: Always working on every page
document.getElementById('menuBtn').onclick = () => sideMenu.classList.add('open');
document.getElementById('closeBtn').onclick = () => sideMenu.classList.remove('open');
document.getElementById('sidebarSupport').onclick = () => window.open("https://yourcustomersupporturl", "_blank");
document.getElementById('sidebarTelegram').onclick = () => window.open("https://t.me/yourtelegramchannel", "_blank");

if (typeof firebase !== "undefined") {
  firebase.auth().onAuthStateChanged(user => {
    if (!user) window.location = 'login.html';
    document.getElementById('sidebarUserId').textContent = user.uid;
    firebase.firestore().collection('users').doc(user.uid).get().then(doc => {
      document.getElementById('sidebarVIP').textContent = doc.data()?.vipLevel || 'Standard';
    });
  });
}

// PLANS: Show cards for Primary and VIP, Purchased tab for what user picks
const plans = {
  primary: [
    { name:'Tata', income:500, days:18, price:200 },
    { name:'Steel Corp', income:350, days:12, price:120 }
  ],
  vip: [
    { name:'Reliance', income:1200, days:25, price:850 }
  ]
};
function getPurchased() {
  return JSON.parse(localStorage.getItem("purchasedPlans") || "[]");
}
function setPurchased(arr) {
  localStorage.setItem("purchasedPlans", JSON.stringify(arr));
}
function renderPlans(tabName) {
  const container = document.getElementById(tabName);
  container.innerHTML = "";
  const currentPlans = plans[tabName] || [];
  currentPlans.forEach((plan, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      `<h3>${plan.name}</h3>
      <div>Day Income: ₹${plan.income}</div>
      <div>Income Days: ${plan.days} days</div>
      <div>Invest Price: ₹${plan.price}</div>
      <button class="btn-primary" onclick="purchasePlan('${tabName}',${idx})">Invest Now</button>`;
    container.appendChild(card);
  });
}
window.purchasePlan = function(tabName, idx) {
  const plan = plans[tabName][idx];
  let purchased = getPurchased();
  purchased.push(plan);
  setPurchased(purchased);
  alert(`Purchased ${plan.name}!`);
  renderPurchased();
};
function renderPurchased() {
  const container = document.getElementById('purchased');
  const purchased = getPurchased();
  container.innerHTML = purchased.length === 0 ?
    '<div class="card"><p>No plans purchased yet.</p></div>' : "";
  purchased.forEach(plan => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML =
      `<h3>${plan.name}</h3>
      <div>Day Income: ₹${plan.income}</div>
      <div>Income Days: ${plan.days} days</div>
      <div>Invest Price: ₹${plan.price}</div>
      <div style="color:green;letter-spacing:1px;margin-top:7px;"><b>Purchased</b></div>`;
    container.appendChild(card);
  });
}
// Tabs logic
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
tabButtons.forEach(button => {
  button.onclick = () => {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    button.classList.add('active');
    document.getElementById(button.dataset.tab).classList.add('active');
    if (button.dataset.tab === 'primary') renderPlans('primary');
    else if (button.dataset.tab === 'vip') renderPlans('vip');
    else renderPurchased();
  }
});
// Initial rendering
renderPlans('primary');
