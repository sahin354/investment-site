import { supabase } from "./supabase.js";

/* =========================
   PASSWORD TOGGLE (👁️)
========================= */
function setupPasswordToggle(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const wrapper = input.closest(".password-wrapper");
  if (!wrapper) return;

  wrapper.style.position = "relative";

  const eye = document.createElement("span");
  eye.textContent = "👁️";
  eye.style.position = "absolute";
  eye.style.right = "14px";
  eye.style.top = "50%";
  eye.style.transform = "translateY(-50%)";
  eye.style.cursor = "pointer";
  eye.style.fontSize = "16px";
  eye.style.opacity = "0.6";
  eye.style.userSelect = "none";

  eye.onclick = () => {
    if (input.type === "password") {
      input.type = "text";
      eye.style.opacity = "1";
    } else {
      input.type = "password";
      eye.style.opacity = "0.6";
    }
  };

  wrapper.appendChild(eye);
}

// Register page
setupPasswordToggle("password");
setupPasswordToggle("confirmPassword");

// Login page
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

    // Basic validation
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

    registerBtn.disabled = true;
    registerBtn.textContent = "Creating account...";

    // 🔐 Supabase handles duplicate EMAIL automatically
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

    registerBtn.disabled = false;
    registerBtn.textContent = "Register";

    if (error) {
      const msg = error.message.toLowerCase();

      if (msg.includes("already") || msg.includes("registered")) {
        alert("Already registered. Please login.");
      } else {
        alert(error.message);
      }
      return;
    }

    // Success message
    alert(
      "🎉 Thank you for joining us!\n\nPlease check your email to confirm your account."
    );

    window.location.href = "login.html";
  });
}

/* =========================
   LOGIN LOGIC (EMAIL / PHONE)
========================= */
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const loginId = document.getElementById("loginId").value.trim();
    const password =
      document.getElementById("loginPassword").value;

    if (!loginId || !password) {
      alert("Please enter email or phone and password");
      return;
    }

    // Try login as email first
    let { error } = await supabase.auth.signInWithPassword({
      email: loginId,
      password
    });

    // If email fails, try phone
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

      ({ error } = await supabase.auth.signInWithPassword({
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
