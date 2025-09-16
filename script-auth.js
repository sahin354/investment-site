if(document.getElementById('loginForm')){
  loginForm.onsubmit = e => {
    e.preventDefault();
    auth.signInWithEmailAndPassword(loginEmailPhone.value, loginPassword.value)
      .then(()=>window.location='index.html')
      .catch(e=>alert(e.message));
  };
  forgotPass.onclick = () => {
    const email = loginEmailPhone.value;
    if(!email) return alert("Type email above for reset.");
    auth.sendPasswordResetEmail(email)
      .then(()=>alert("Password reset mail sent."))
      .catch(e=>alert(e.message));
  };
}
if(document.getElementById('registerForm')){
  registerForm.onsubmit = e => {
    e.preventDefault();
    if(regPass.value!==regConfirmPass.value) return alert("Passwords do not match!");
    auth.createUserWithEmailAndPassword(regEmail.value, regPass.value)
      .then(u=>db.collection('users').doc(u.user.uid).set({
        name:regName.value, phone:regPhone.value, email:regEmail.value, rechargeBalance:"0.00", withdrawalBalance:"0.00", vipLevel:"Standard"
      }))
      .then(()=>window.location='index.html')
      .catch(e=>alert(e.message));
  };
}
