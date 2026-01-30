/* ==========================================================
   FILE: signup.js
   PATH: assets/js/auth/signup.js
========================================================== */

import { supabase } from "../core/supabase.js";
import { redirectIfLoggedIn } from "../core/auth.js";

redirectIfLoggedIn();

const form = document.getElementById("signupForm");
const errorMsg = document.getElementById("errorMsg");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorMsg.textContent = "";

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!name || !email || !password) {
    errorMsg.textContent = "All fields are required";
    return;
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    errorMsg.textContent = error.message;
    return;
  }

  window.location.replace("/pages/user/dashboard.html");
});
