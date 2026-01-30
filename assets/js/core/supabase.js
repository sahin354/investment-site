/* =========================================================
   FILE: supabase.js
   PATH: assets/js/core/supabase.js

   SOURCE:
   - Keys taken directly from existing ZIP
   - Static HTML compatible
   - Vercel compatible
========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= SUPABASE CONFIG ================= */

const SUPABASE_URL = "https://zrufavpxsnootmvwybye.supabase.co";
const SUPABASE_ANON_KEY =
  "sb_publishable_EvHDWxi1BcEjcv_UnycVIQ_3T-V_A5s";

/* ================= CLIENT ================= */

export const supabase = createClient(
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

/* ================= HELPERS ================= */

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/pages/auth/login.html";
}
