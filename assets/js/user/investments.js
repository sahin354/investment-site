/* ==========================================================
   FILE: investments.js
   PATH: assets/js/user/investments.js
========================================================== */

import { supabase, signOut } from "../core/supabase.js";
import { requireUser } from "../core/route-guard.js";

/* ==========================================================
   ELEMENTS
========================================================== */

const totalInvestedEl = document.getElementById("totalInvested");
const totalProfitEl = document.getElementById("totalProfit");
const investmentListEl = document.getElementById("investmentList");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================
   INIT
========================================================== */

(async function initInvestments() {
  const user = await requireUser();
  if (!user) return;

  loadInvestments(user.id);
})();

/* ==========================================================
   LOAD INVESTMENTS
========================================================== */

async function loadInvestments(userId) {
  const { data } = await supabase
    .from("investments")
    .select("plan_name, amount, profit")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  investmentListEl.innerHTML = "";

  if (!data || data.length === 0) {
    investmentListEl.innerHTML = "<li>No investments found</li>";
    return;
  }

  let totalInvested = 0;
  let totalProfit = 0;

  data.forEach(inv => {
    totalInvested += inv.amount;
    totalProfit += inv.profit || 0;

    const li = document.createElement("li");
    li.innerHTML = `
      <span>${inv.plan_name}</span>
      <span class="amount">₹${inv.amount}</span>
      <span class="profit">+₹${inv.profit || 0}</span>
    `;
    investmentListEl.appendChild(li);
  });

  totalInvestedEl.textContent = `₹${totalInvested}`;
  totalProfitEl.textContent = `₹${totalProfit}`;
}

/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", () => {
  signOut();
});
