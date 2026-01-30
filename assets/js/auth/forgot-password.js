/* ==========================================================
   FILE: forgot-password.js
   PATH: assets/js/auth/forgot-password.js
========================================================== */

import { supabase } from "../core/supabase.js";

const form = document.getElementById("resetForm");
const errorMsg = document.getElementById("errorMsg");
const successMsg = document.getElementById("successMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";
  successMsg.textContent = "";

  const email = document.getElementById("email").value.trim();

  if (!email) {
    errorMsg.textContent = "Email is required";
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/pages/auth/login.html`
  });

  if (error) {
    errorMsg.textContent = error.message;
    return;
  }

  successMsg.textContent = "Password reset link sent to your email";
});
