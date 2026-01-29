/* ==========================================================
   FILE: route-guard.js
   PATH: assets/js/core/route-guard.js

   PURPOSE:
   - Page-level protection
   - Admin access enforcement
   - Auto block unauthorized access
========================================================== */

import { supabase, getUser } from "./supabase.js";

/* ==========================================================
   ADMIN EMAIL WHITELIST
========================================================== */

const ADMIN_EMAILS = [
  "admin@example.com"
];

/* ==========================================================
   ADMIN GUARD
========================================================== */

export async function requireAdmin() {
  const user = await getUser();

  if (!user) {
    window.location.replace("/pages/auth/login.html");
    return;
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    await blockUser(user.id);
    window.location.replace("/pages/errors/blocked.html");
  }
}

/* ==========================================================
   USER GUARD
========================================================== */

export async function requireUser() {
  const user = await getUser();

  if (!user) {
    window.location.replace("/pages/auth/login.html");
    return;
  }

  return user;
}

/* ==========================================================
   BLOCK USER (LOG ATTEMPT)
========================================================== */

async function blockUser(userId) {
  try {
    await supabase.from("blocked_users").insert({
      user_id: userId,
      reason: "Unauthorized admin access attempt"
    });
  } catch (err) {
    console.error("Block log failed");
  }
}
