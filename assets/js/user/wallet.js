/* ==========================================================
   FILE: wallet.js
   PATH: assets/js/user/wallet.js
========================================================== */

import { supabase, signOut } from "../core/supabase.js";
import { requireUser } from "../core/route-guard.js";

/* ==========================================================
   ELEMENTS
========================================================== */

const balanceEl = document.getElementById("walletBalance");
const transactionListEl = document.getElementById("transactionList");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================
   INIT
========================================================== */

(async function initWallet() {
  const user = await requireUser();
  if (!user) return;

  loadWalletBalance(user.id);
  loadTransactions(user.id);
})();

/* ==========================================================
   LOAD BALANCE
========================================================== */

async function loadWalletBalance(userId) {
  const { data } = await supabase
    .from("wallets")
    .select("balance")
    .eq("user_id", userId)
    .single();

  balanceEl.textContent = data ? `₹${data.balance.toFixed(2)}` : "₹0.00";
}

/* ==========================================================
   LOAD TRANSACTIONS
========================================================== */

async function loadTransactions(userId) {
  const { data } = await supabase
    .from("transactions")
    .select("type, amount, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  transactionListEl.innerHTML = "";

  if (!data || data.length === 0) {
    transactionListEl.innerHTML = "<li>No transactions found</li>";
    return;
  }

  data.forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `${tx.type.toUpperCase()} • ₹${tx.amount}`;
    transactionListEl.appendChild(li);
  });
}

/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", () => {
  signOut();
});
