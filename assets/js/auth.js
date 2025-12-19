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

  eye.onclick = () => {
    input.type = input.type === "password" ? "text" : "password";
    eye.style.opacity = input.type === "text" ? "1" : "0.6";
  };

  wrapper.appendChild(eye);
}

setupPasswordToggle("password");
setupPasswordToggle("confirmPassword");
setupPasswordToggle("loginPassword");

/* =========================
   REGISTER LOGIC (FIXED)
========================= */
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const fullName = name.value.trim();
    const phone = phoneInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!fullName || !phone || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    registerBtn.disabled = true;
    registerBtn.textContent = "Checking account...";

    /* 🔍 STEP 1: TRY LOGIN FIRST */
    const { error: loginCheckError } =
      await supabase.auth.signInWithPassword({
        email,
        password
      });

    if (!loginCheckError) {
      alert("Already registered. Please login.");
      registerBtn.disabled = false;
      registerBtn.textContent = "Register";
      return;
    }

    /* 🔐 STEP 2: SIGN UP */
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone
        }
      }
    });

    registerBtn.disabled = false;
    registerBtn.textContent = "Register";

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      "🎉 Thank you for joining us!\n\nPlease check your email to confirm your account."
    );

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

    const loginId = loginIdInput.value.trim();
    const password = loginPassword.value;

    let { error } = await supabase.auth.signInWithPassword({
      email: loginId,
      password
    });

    if (error) {
      if (
        error.message.toLowerCase().includes("confirm") ||
        error.message.toLowerCase().includes("verify")
      ) {
        alert("Please verify your email before login.");
        return;
      }

      alert("Invalid email or password");
      return;
    }

    alert("✅ Login successful!");
    window.location.href = "index.html";
  });
}
