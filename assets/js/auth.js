import { supabase } from "./supabase.js";

/* =========================
   PASSWORD TOGGLE (SAFE)
========================= */

function setupPasswordToggle(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest(".password-wrapper");
  if (!wrapper) return;

  const toggle = document.createElement("span");
  toggle.textContent = "Show";
  toggle.style.position = "absolute";
  toggle.style.right = "15px";
  toggle.style.top = "50%";
  toggle.style.transform = "translateY(-50%)";
  toggle.style.cursor = "pointer";
  toggle.style.fontSize = "13px";
  toggle.style.color = "#5b6df7";
  toggle.style.userSelect = "none";

  toggle.onclick = () => {
    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "Hide";
    } else {
      input.type = "password";
      toggle.textContent = "Show";
    }
  };

  wrapper.style.position = "relative";
  wrapper.appendChild(toggle);
}

// Register page toggles
setupPasswordToggle("password");
setupPasswordToggle("confirmPassword");

// Login page toggle
setupPasswordToggle("loginPassword");

/* =========================
   REGISTER LOGIC
========================= */

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const fullName = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword =
      document.getElementById("confirmPassword").value;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    // Gmail only
    if (!email.endsWith("@gmail.com")) {
      alert("Only @gmail.com emails are allowed");
      return;
    }

    // Phone validation
    if (!/^\d{10}$/.test(phone)) {
      alert("Mobile number must be 10 digits");
      return;
    }

    // Password rule
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;

    if (!passwordRegex.test(password)) {
      alert("Password must be like: password@836");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // 🔁 Duplicate email / phone check
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .or(`email.eq.${email},phone.eq.${phone}`)
      .maybeSingle();

    if (existing) {
      alert("Email or phone number already registered");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    const { error } = await supabase.auth.signUp({
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
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
      return;
    }

    alert("✅ Registration successful! Please login.");
    window.location.href = "login.html";
  });
}

/* =========================
   LOGIN LOGIC (FIXED)
========================= */

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const password =
      document.getElementById("loginPassword").value;

    if (!loginId || !password) {
      alert("Please enter email/phone and password");
      return;
    }

    // Try email login
    let { data, error } = await supabase.auth.signInWithPassword({
      email: loginId,
      password
    });

    // If email login fails, try phone
    if (error) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("phone", loginId)
        .maybeSingle();

      if (!profile) {
        alert("Invalid login credentials");
        return;
      }

      ({ data, error } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password
      }));
    }

    if (error) {
      alert(error.message);
      return;
    }

    alert("✅ Login successful!");
    window.location.href = "index.html";
  });
       }
