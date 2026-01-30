/* ==========================================================
   FILE: transactions.js
   PATH: assets/js/user/transactions.js
========================================================== */

import { supabase, signOut } from "../core/supabase.js";
import { requireUser } from "../core/route-guard.js";

const transactionListEl = document.getElementById("transactionList");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================
   INIT
========================================================== */

(async function initTransactions() {
  const user = await requireUser();
  if (!user) return;

  loadTransactions(user.id);
})();

/* ==========================================================
   LOAD TRANSACTIONS
========================================================== */

async function loadTransactions(userId) {
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  transactionListEl.innerHTML = "";

  if (!data || data.length === 0) {
    transactionListEl.innerHTML = "<li>No transactions found</li>";
    return;
  }

  data.forEach(tx => {
    const li = document.createElement("li");

    const type = document.createElement("span");
    type.className = "tx-type";
    type.textContent = tx.type.toUpperCase();

    const amount = document.createElement("span");
    amount.className = `tx-amount ${tx.type === "credit" ? "credit" : "debit"}`;
    amount.textContent = `₹${tx.amount}`;

    const date = document.createElement("span");
    date.className = "tx-date";
    date.textContent = new Date(tx.created_at).toLocaleDateString();

    li.appendChild(type);
    li.appendChild(amount);
    li.appendChild(date);

    transactionListEl.appendChild(li);
  });
}

/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", () => {
  signOut();
});
