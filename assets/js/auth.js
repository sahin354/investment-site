// auth.js
import { supabase } from './supabase.js';

console.log('Simple auth.js loaded');

// ================= HELPER FUNCTIONS =================

function showAlert(message) {
    alert(message);
}

// Global helper to generate referral code (Available to all functions)
function generateReferralCode(uid) {
    // Falls back to random string if UID is not provided, though UID is preferred
    if (!uid) return "INV" + Math.random().toString(36).substring(2, 10).toUpperCase();
    return "INV" + uid.replace(/-/g, "").slice(0, 8).toUpperCase();
}

// ================= DOM EVENT LISTENERS =================

// REGISTRATION - SIMPLE VERSION
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const fullName = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Basic validation
        if (!fullName || !phone || !email || !password) {
            showAlert('Please fill all fields');
            return;
        }
        
        if (password !== confirmPassword) {
            showAlert('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            showAlert('Password must be at least 6 characters');
            return;
        }
        
        try {
            showAlert('Step 1: Creating account...');
            
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone
                    }
                }
            });

            if (authError) {
                const msg = (authError.message || "").toLowerCase();
                if (msg.includes("already") && (msg.includes("registered") || msg.includes("exists"))) {
                    alert("User already registered! Please login.");
                } else {
                    alert("Auth Error: " + authError.message);
                }
                return;
            }
            
            if (!authData.user) {
                showAlert('No user created');
                return;
            }

            // -------------------- Referral Logic --------------------
            const user = authData.user;
            const userId = user.id;

            // Get referral code from URL if available
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get("ref");

            let referredById = null;

            if (refCode) {
                const { data: refUser, error: refErr } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("referral_code", refCode)
                    .single();

                if (!refErr && refUser) {
                    referredById = refUser.id;
                }
            }

            // Generate user's referral code using the global helper
            const referralCode = generateReferralCode(user.id);
            // ----------------------------------------------------------------

            showAlert('Step 2: Creating profile...');
            
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    full_name: fullName,
                    phone: phone,
                    email: email,
                    balance: 0,
                    referral_code: referralCode,
                    referred_by: referredById,
                    is_vip: false,
                    is_blocked: false
                });
            
            if (profileError) {
                showAlert('Profile Error: ' + profileError.message);                
                await supabase.auth.signOut();
                return;
            }

            showAlert('✅ Registration successful! You can now login.');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            showAlert('Registration failed: ' + error.message);
        }
    });
}

// LOGIN - SIMPLE VERSION
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginId = document.getElementById('loginId').value.trim();
        const password = document.getElementById('password').value;
        
        if (!loginId || !password) {
            showAlert('Please enter email/phone and password');
            return;
        }
        
        try {
            showAlert('Logging in...');
            
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginId,
                password: password
            });
            
            if (error) {
                // Fallback: Try to login via phone (by looking up email first)
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('phone', loginId)
                    .single();
                
                if (profile) {
                    const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                        email: profile.email,
                        password: password
                    });
                    
                    if (retryError) {
                        showAlert('Login failed: ' + retryError.message);
                        return;
                    }
                    
                    showAlert('✅ Login successful!');
                    setTimeout(() => window.location.href = 'index.html', 1000);
                    return;
                }
                
                showAlert('Login failed: ' + error.message);
                return;
            }
            
            showAlert('✅ Login successful!');
            setTimeout(() => window.location.href = 'index.html', 1000);
            
        } catch (error) {
            showAlert('Login error: ' + error.message);
        }
    });
}

// ================= UTILITY FUNCTIONS =================

// Logout Function
async function logoutUser() {
    const { error } = await supabase.auth.signOut();
    if (!error) {
        localStorage.removeItem("sb-user");
        window.location.href = "login.html"; 
    } else {
        alert("Logout Failed: " + error.message);
    }
}
// Expose logout to global scope for HTML onclick events
window.logoutUser = logoutUser;


// Standalone Signup Function (Utility)
// Note: This logic differs slightly from the event listener above (it checks for triggers)
async function signUp(email, password, phone, fullName) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          phone: phone,
          full_name: fullName
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Wait a moment for the potential Database Trigger to run
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if profile was created by a Trigger
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profile && !profileError) {
        // Manually create profile if trigger failed
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email: email,
            phone: phone,
            full_name: fullName,
            wallet_balance: 0,
            referral_code: generateReferralCode(authData.user.id) // Uses shared helper
          });

        if (createError) {
          console.warn('Manual profile creation failed:', createError);
        }
      }

      return { success: true, user: authData.user };
    }
  } catch (error) {
    console.error('Signup error:', error);
    return { success: false, error: error.message };
  }
    }
    
