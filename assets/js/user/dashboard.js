/* ==========================================================
   FILE: dashboard.js
   PATH: assets/js/user/dashboard.js
========================================================== */

import { supabase, signOut } from "../core/supabase.js";
import { requireUser } from "../core/route-guard.js";

/* ==========================================================
   INIT
========================================================== */

const totalBalanceEl = document.getElementById("totalBalance");
const activeInvestmentsEl = document.getElementById("activeInvestments");
const totalProfitEl = document.getElementById("totalProfit");
const activityListEl = document.getElementById("activityList");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================
   LOAD DASHBOARD
========================================================== */

(async function initDashboard() {
  const user = await requireUser();
  if (!user) return;

  loadStats(user.id);
  loadActivity(user.id);
})();

/* ==========================================================
   LOAD STATS
========================================================== */

async function loadStats(userId) {
  // Example table names — match your Supabase schema
  const { data: investments } = await supabase
    .from("investments")
    .select("amount, profit")
    .eq("user_id", userId);

  if (!investments) return;

  let balance = 0;
  let profit = 0;

  investments.forEach(inv => {
    balance += inv.amount;
    profit += inv.profit || 0;
  });

  totalBalanceEl.textContent = `₹${balance.toFixed(2)}`;
  totalProfitEl.textContent = `₹${profit.toFixed(2)}`;
  activeInvestmentsEl.textContent = investments.length;
}

/* ==========================================================
   LOAD ACTIVITY
========================================================== */

async function loadActivity(userId) {
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(5);

  activityListEl.innerHTML = "";

  if (!data || data.length === 0) {
    activityListEl.innerHTML = "<li>No recent activity</li>";
    return;
  }

  data.forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `${tx.type} • ₹${tx.amount}`;
    activityListEl.appendChild(li);
  });
}

/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", () => {
  signOut();
});
