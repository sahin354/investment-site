/* =========================================================
   FILE: supabase.js
   PATH: assets/js/core/supabase.js

   RULES:
   - ONLY Supabase init file in project
   - Imported everywhere
   - NO UI
   - NO direct DB queries
========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

/* ================= ENV ================= */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error("Supabase ENV missing");
}

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
  return session?.user ?? null;
}

export async function signOut() {
  await supabase.auth.signOut();
  window.location.href = "/pages/auth/login.html";
}
