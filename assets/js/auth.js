// auth.js - COMPLETE FIXED VERSION
import { supabase } from './supabase.js';

console.log('Auth.js loaded');

// ================= HELPER FUNCTIONS =================

function showAlert(message) {
    alert(message);
}

function generateReferralCode() {
    return "REF" + Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ================= REGISTRATION FORM =================

const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const fullName = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim().toLowerCase();
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
        
        // Validate email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showAlert('Please enter a valid email address');
            return;
        }
        
        // Validate phone (10 digits)
        if (!/^\d{10}$/.test(phone)) {
            showAlert('Please enter a valid 10-digit phone number');
            return;
        }
        
        // Disable form during processing
        const submitBtn = registerForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';
        
        try {
            // 1. Sign up with Supabase Auth
            showAlert('Creating account...');
            
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
                console.error('Auth error:', authError);
                
                if (authError.message.includes('already registered') || 
                    authError.message.includes('already exists') ||
                    authError.code === 'user_already_exists') {
                    showAlert('This email is already registered. Please login instead.');
                } else {
                    showAlert('Registration error: ' + authError.message);
                }
                return;
            }
            
            if (!authData?.user) {
                showAlert('Registration failed: No user created');
                return;
            }

            const user = authData.user;
            console.log('User created:', user.id);

            // 2. Wait a moment for auth to complete
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 3. Check for referral code from URL
            const urlParams = new URLSearchParams(window.location.search);
            const refCode = urlParams.get("ref");
            let referredById = null;

            if (refCode) {
                const { data: refUser } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("referral_code", refCode)
                    .single();

                if (refUser) {
                    referredById = refUser.id;
                }
            }

            // 4. Generate referral code for new user
            const referralCode = generateReferralCode();
            
            // 5. Create user profile with CORRECT COLUMN NAME: wallet_balance
            showAlert('Creating profile...');
            
            const { error: profileError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    email: email,
                    phone: phone,
                    full_name: fullName,
                    wallet_balance: 0,  // FIXED: Changed from 'balance' to 'wallet_balance'
                    referral_code: referralCode,
                    referred_by: referredById,
                    is_vip: false,
                    is_blocked: false,
                    created_at: new Date().toISOString()
                });
            
            if (profileError) {
                console.error('Profile error:', profileError);
                
                // If profile already exists (duplicate signup attempt), continue
                if (profileError.code === '23505') {
                    console.log('Profile already exists, continuing...');
                } else {
                    showAlert('Profile creation error: ' + profileError.message);
                    
                    // Try to delete the auth user if profile creation failed
                    try {
                        await supabase.auth.admin.deleteUser(user.id);
                    } catch (deleteErr) {
                        console.error('Could not delete auth user:', deleteErr);
                    }
                    
                    return;
                }
            }

            // 6. Registration successful
            showAlert('✅ Registration successful! Redirecting to login...');
            
            // Clear form
            registerForm.reset();
            
            // Redirect to login after delay
            setTimeout(() => {
                window.location.href = 'login.html?message=Registration successful! Please login.';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            showAlert('Registration failed: ' + (error.message || 'Unknown error'));
        } finally {
            // Re-enable form button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ================= LOGIN FORM =================

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
        
        // Disable form during processing
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';
        
        try {
            // Try as email first
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginId,
                password: password
            });
            
            if (error) {
                // Try as phone number
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('phone', loginId)
                    .single();
                
                if (profile?.email) {
                    const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                        email: profile.email,
                        password: password
                    });
                    
                    if (retryError) {
                        showAlert('Login failed: Invalid credentials');
                        return;
                    }
                    
                    // Login successful with phone
                    showAlert('✅ Login successful!');
                    setTimeout(() => window.location.href = 'index.html', 1000);
                    return;
                }
                
                // If still error, show message
                if (error.message.includes('Invalid login credentials')) {
                    showAlert('Invalid email/phone or password');
                } else {
                    showAlert('Login failed: ' + error.message);
                }
                return;
            }
            
            // Login successful with email
            showAlert('✅ Login successful!');
            setTimeout(() => window.location.href = 'index.html', 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            showAlert('Login error: ' + error.message);
        } finally {
            // Re-enable form button
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        }
    });
}

// ================= UTILITY FUNCTIONS =================

// Logout Function
async function logoutUser() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            alert("Logout Failed: " + error.message);
            return;
        }
        
        // Clear local storage
        localStorage.removeItem("sb-user");
        localStorage.removeItem("userMobile");
        
        // Redirect to login
        window.location.href = "login.html";
        
    } catch (error) {
        console.error('Logout error:', error);
        alert("Logout failed");
    }
}

// Expose logout to global scope for HTML onclick events
window.logoutUser = logoutUser;

// ================= AUTO-LOGIN CHECK =================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            console.log('User already logged in:', user.email);
            
            // On login page, redirect to home
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                window.location.href = 'index.html';
            }
        } else {
            // Not logged in
            // On protected pages, redirect to login
            const protectedPages = ['index.html', 'recharge.html', 'refer.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Auto-login check error:', error);
    }
});
