// auth.js
import { supabase } from './supabase.js';

function showAlert(msg) {
  alert(msg);
}

// ================= REGISTER =================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  document.getElementById("registerBtn").addEventListener("click", async () => {

    const fullName = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // ----------- VALIDATIONS -----------

    // Gmail only
    if (!email.endsWith("@gmail.com")) {
      showAlert("Only @gmail.com emails are allowed");
      return;
    }

    // Phone 10 digits
    if (!/^\d{10}$/.test(phone)) {
      showAlert("Mobile number must be 10 digits");
      return;
    }

    // Password format
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;

    if (!passwordRegex.test(password)) {
      showAlert("Password must be like: password@836");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match");
      return;
    }

    // ----------- CHECK ALREADY REGISTERED -----------

    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (existingUser) {
      showAlert("Already registered");
      return;
    }

    // ----------- SUPABASE AUTH -----------

    const btn = document.getElementById("registerBtn");
    btn.disabled = true;
    btn.textContent = "Creating account...";

    const { data: authData, error: authError } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone
          }
        }
      });

    if (authError || !authData.user) {
      showAlert(authError?.message || "Registration failed");
      btn.disabled = false;
      btn.textContent = "Register";
      return;
    }

    // ----------- PROFILE INSERT -----------

    const userId = authData.user.id;
    const referralCode = "REF" + userId.slice(0, 8).toUpperCase();

    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        full_name: fullName,
        phone,
        email,
        balance: 0,
        referral_code: referralCode,
        is_vip: false
      });

    if (profileError) {
      showAlert(profileError.message);
      btn.disabled = false;
      btn.textContent = "Register";
      return;
    }

    showAlert("✅ Registration successful!");
    setTimeout(() => window.location.href = "login.html", 1500);
  });
        }
