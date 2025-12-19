import { supabase } from "./supabase.js";

/* ======================
   PASSWORD TOGGLE LOGIC
====================== */

// Utility to add show/hide toggle
function addPasswordToggle(inputId, labelText) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Create toggle button
  const toggle = document.createElement("span");
  toggle.textContent = "Show";
  toggle.style.cursor = "pointer";
  toggle.style.fontSize = "12px";
  toggle.style.color = "#4a6cf7";
  toggle.style.float = "right";
  toggle.style.marginTop = "6px";

  toggle.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      toggle.textContent = "Hide";
    } else {
      input.type = "password";
      toggle.textContent = "Show";
    }
  });

  // Insert toggle after input
  input.parentElement.appendChild(toggle);
}

// Apply toggle to both fields
addPasswordToggle("password");
addPasswordToggle("confirmPassword");

/* ======================
   REGISTER LOGIC
====================== */

const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", async () => {
    const fullName = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    // Basic validation
    if (!fullName || !phone || !email || !password || !confirmPassword) {
      alert("Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    // Gmail only
    if (!email.endsWith("@gmail.com")) {
      alert("Only @gmail.com emails are allowed");
      return;
    }

    // 10 digit phone
    if (!/^\d{10}$/.test(phone)) {
      alert("Mobile number must be 10 digits");
      return;
    }

    // Strong password rule
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;

    if (!passwordRegex.test(password)) {
      alert("Password must be like: password@836");
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
