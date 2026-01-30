/* =========================================================
   FILE: supabase.js
   PATH: assets/js/core/supabase.js

   PURPOSE:
   - Single global Supabase client
   - Static HTML safe (Vercel compatible)
   - Base of entire security system
========================================================= */

/* ================= SUPABASE CONFIG ================= */

/* 🔓 PUBLIC keys (safe by design, security via RLS) */
const SUPABASE_URL = "https://zrufavpxsnootmvwybye.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_EvHDWxi1BcEjcv_UnycVIQ_3T-V_A5s";

/* ================= CLIENT INIT ================= */

/*
  NOTE:
  - `supabase` object comes from CDN script
  - Loaded in HTML before this file
*/

window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

/* ================= GLOBAL HELPERS ================= */

/* Get active session */
window.getSession = async () => {
  const { data } = await window.supabaseClient.auth.getSession();
  return data.session;
};

/* Get logged-in user */
window.getUser = async () => {
  const session = await window.getSession();
  return session ? session.user : null;
};

/* Logout everywhere */
window.signOut = async () => {
  await window.supabaseClient.auth.signOut();
  window.location.href = "/pages/auth/login.html";
};