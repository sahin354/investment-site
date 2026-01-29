/* ==========================================================
   FILE: login.js
   PATH: assets/js/auth/login.js

   PURPOSE:
   - Secure user login via Supabase
   - Client-side validation
   - Error handling + redirect
========================================================== */

import { supabase } from "../core/supabase.js";
import { redirectIfLoggedIn } from "../core/auth.js";

/* ==========================================================
   REDIRECT IF ALREADY LOGGED IN
========================================================== */

redirectIfLoggedIn();

/* ==========================================================
   ELEMENTS
========================================================== */

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const errorMsg = document.getElementById("errorMsg");

/* ==========================================================
   FORM SUBMIT
========================================================== */

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  if (!email || !password) {
    errorMsg.textContent = "Email and password are required";
    return;
  }

  form.querySelector("button").disabled = true;
  form.querySelector("button").textContent = "Signing in...";

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    errorMsg.textContent = error.message;
    form.querySelector("button").disabled = false;
    form.querySelector("button").textContent = "Login";
    return;
  }

  // ✅ Success → dashboard
  window.location.replace("/pages/user/dashboard.html");
});
