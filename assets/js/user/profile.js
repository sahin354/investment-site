/* ==========================================================
   FILE: profile.js
   PATH: assets/js/user/profile.js
========================================================== */

import { supabase, signOut } from "../core/supabase.js";
import { requireUser } from "../core/route-guard.js";

const fullNameInput = document.getElementById("fullName");
const emailInput = document.getElementById("email");
const form = document.getElementById("profileForm");
const successMsg = document.getElementById("successMsg");
const errorMsg = document.getElementById("errorMsg");
const logoutBtn = document.getElementById("logoutBtn");

/* ==========================================================
   INIT
========================================================== */

(async function initProfile() {
  const user = await requireUser();
  if (!user) return;

  emailInput.value = user.email;
  fullNameInput.value = user.user_metadata?.full_name || "";
})();

/* ==========================================================
   UPDATE PROFILE
========================================================== */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  successMsg.textContent = "";
  errorMsg.textContent = "";

  const fullName = fullNameInput.value.trim();

  if (!fullName) {
    errorMsg.textContent = "Name cannot be empty";
    return;
  }

  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });

  if (error) {
    errorMsg.textContent = error.message;
    return;
  }

  successMsg.textContent = "Profile updated successfully";
});

/* ==========================================================
   LOGOUT
========================================================== */

logoutBtn.addEventListener("click", () => {
  signOut();
});
