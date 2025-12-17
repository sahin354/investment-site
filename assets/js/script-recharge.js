// auth.js - SIMPLE WORKING VERSION
import { supabase } from './supabase.js';

console.log('Auth loaded');

// Registration
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get values
        const fullName = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
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
        
        // Disable button
        const btn = registerForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Creating account...';
        
        try {
            console.log('Starting registration for:', email);
            
            // 1. Create auth user
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
                    authError.code === 'user_already_exists') {
                    alert('This email is already registered. Please login instead.');
                } else {
                    alert('Registration error: ' + authError.message);
                }
                return;
            }
            
            if (!authData.user) {
                alert('No user created');
                return;
            }

            console.log('User created:', authData.user.id);
            
            // Wait for auth to complete
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 2. Check if profile already exists
            const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', authData.user.id)
                .single()
                .catch(() => ({ data: null }));
            
            if (existingProfile) {
                console.log('Profile already exists');
                alert('✅ Registration successful! Account already exists.');
            } else {
                // 3. Create profile with SIMPLE structure
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        email: email,
                        full_name: fullName,
                        phone: phone,
                        wallet_balance: 0
                    });
                
                if (profileError) {
                    console.error('Profile error:', profileError);
                    
                    // If duplicate, that's okay
                    if (profileError.code === '23505') {
                        console.log('Profile already exists');
                    } else {
                        alert('Profile creation error: ' + profileError.message);
                        return;
                    }
                }
                
                console.log('Profile created successfully');
                alert('✅ Registration successful!');
            }
            
            // Clear form
            registerForm.reset();
            
            // Redirect to login
            setTimeout(() => {
                window.location.href = 'login.html?message=Registration+successful';
            }, 1500);
            
        } catch (error) {
            console.error('Registration error:', error);
            alert('Registration failed: ' + (error.message || 'Unknown error'));
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const loginId = document.getElementById('loginId').value.trim();
        const password = document.getElementById('password').value;
        
        if (!loginId || !password) {
            alert('Please enter email/phone and password');
            return;
        }
        
        const btn = loginForm.querySelector('button[type="submit"]');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'Logging in...';
        
        try {
            console.log('Attempting login with:', loginId);
            
            // Try as email first
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginId,
                password: password
            });
            
            if (error) {
                console.log('Email login failed, trying phone...');
                
                // Try as phone number
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email')
                    .eq('phone', loginId)
                    .single()
                    .catch(() => ({ data: null }));
                
                if (profile && profile.email) {
                    const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                        email: profile.email,
                        password: password
                    });
                    
                    if (retryError) {
                        console.error('Phone login error:', retryError);
                        alert('Invalid email/phone or password');
                        return;
                    }
                    
                    console.log('Login successful via phone');
                    alert('✅ Login successful!');
                    setTimeout(() => window.location.href = 'index.html', 1000);
                    return;
                }
                
                console.error('Login error:', error);
                alert('Invalid email/phone or password');
                return;
            }
            
            console.log('Login successful via email');
            alert('✅ Login successful!');
            setTimeout(() => window.location.href = 'index.html', 1000);
            
        } catch (error) {
            console.error('Login error:', error);
            alert('Login error: ' + error.message);
        } finally {
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
}

// Logout
window.logoutUser = async function() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed');
    }
};

// Check login status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            console.log('User logged in:', user.email);
            
            // On login/register pages, redirect to home
            if (window.location.pathname.includes('login.html') || 
                window.location.pathname.includes('register.html')) {
                window.location.href = 'index.html';
            }
        } else {
            // On protected pages, redirect to login
            const protectedPages = ['index.html', 'recharge.html', 'refer.html', 'mine.html'];
            const currentPage = window.location.pathname.split('/').pop();
            
            if (protectedPages.includes(currentPage)) {
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
});
