// auth.js - ULTRA SIMPLE WORKING VERSION
import { supabase } from './supabase.js';

console.log('Auth loaded');

// Registration
document.addEventListener('DOMContentLoaded', () => {
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
            
            const btn = registerForm.querySelector('button[type="submit"]');
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
                    alert('Error: ' + authError.message);
                    return;
                }
                
                if (!authData.user) {
                    alert('No user created');
                    return;
                }

                console.log('User created:', authData.user.id);
                
                // Wait 2 seconds
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 2. Create profile - SIMPLEST POSSIBLE
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        email: email,
                        wallet_balance: 0
                    });
                
                if (profileError) {
                    console.error('Profile error:', profileError);
                    // Continue anyway - profile might already exist
                }
                
                alert('✅ Registration successful! Please login.');
                
                // Clear form
                registerForm.reset();
                
                // Redirect to login
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1500);
                
            } catch (error) {
                console.error('Registration error:', error);
                alert('Error: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Create Account';
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
                alert('Please enter email and password');
                return;
            }
            
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Logging in...';
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email: loginId,
                    password: password
                });
                
                if (error) {
                    alert('Login failed: ' + error.message);
                    return;
                }
                
                alert('✅ Login successful!');
                setTimeout(() => window.location.href = 'index.html', 1000);
                
            } catch (error) {
                console.error('Login error:', error);
                alert('Login error: ' + error.message);
            } finally {
                btn.disabled = false;
                btn.textContent = 'Login';
            }
        });
    }
});

// Logout
window.logoutUser = async function() {
    await supabase.auth.signOut();
    window.location.href = 'login.html';
};
