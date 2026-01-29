/* ==========================================================
   FILE: auth.js
   PATH: assets/js/core/auth.js

   PURPOSE:
   - Authentication guard
   - Protects logged-in pages
   - Redirects unauthorized users
========================================================== */

import { supabase, getSession } from "./supabase.js";

/* ==========================================================
   REQUIRE AUTH (USER PAGES)
========================================================== */

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    window.location.replace("/pages/auth/login.html");
    return;
  }

  return session.user;
}

/* ==========================================================
   REDIRECT IF LOGGED IN (AUTH PAGES)
========================================================== */

export async function redirectIfLoggedIn() {
  const session = await getSession();

  if (session) {
    window.location.replace("/pages/user/dashboard.html");
  }
}

/* ==========================================================
   REAL-TIME AUTH LISTENER
========================================================== */

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    window.location.replace("/pages/auth/login.html");
  }
});
