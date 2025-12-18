// auth.js — FINAL FIXED VERSION
// IMPORTANT: NO PROFILE INSERT HERE (Handled by DB trigger)

import { supabase } from './supabase.js';

console.log('Auth loaded');

// =======================
// REGISTRATION
// =======================
document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('registerForm');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('name').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!fullName || !phone || !email || !password) {
        alert('Please fill all fields');
        return;
      }

      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }

      const btn = registerForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      try {
        // ✅ ONLY AUTH SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });

        if (error) {
          alert(error.message);
          return;
        }

        if (!data?.user) {
          alert('Registration failed');
          return;
        }

        // ✅ PROFILE IS CREATED BY DATABASE TRIGGER
        alert('✅ Registration successful! Please login.');

        registerForm.reset();

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1200);

      } catch (err) {
        console.error('Registration error:', err);
        alert('Registration failed');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }

  // =======================
  // LOGIN
  // =======================
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('loginId').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        alert('Please enter email and password');
        return;
      }

      const btn = loginForm.querySelector('button[type="submit"]');
      const originalText = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      try {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          alert(error.message);
          return;
        }

        alert('✅ Login successful');
        window.location.href = 'index.html';

      } catch (err) {
        console.error('Login error:', err);
        alert('Login failed');
      } finally {
        btn.disabled = false;
        btn.textContent = originalText;
      }
    });
  }
});

// =======================
// LOGOUT
// =======================
window.logoutUser = async () => {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
};
