document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;

    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.textContent = 'Registering...';
    submitButton.disabled = true;

    // Step 1: Create the user in Firebase Authentication with email and password
    firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;

            // Step 2: Send the verification email (this is the "OTP")
            user.sendEmailVerification().then(() => {
                alert('Registration successful! A verification link has been sent to your email.');
            });

            // Step 3: Save the user's complete profile to the Firestore 'users' collection
            return firebase.firestore().collection('users').doc(user.uid).set({
                uid: user.uid,
                fullName: fullName,
                email: email,
                phoneNumber: phoneNumber,
                balance: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isBlocked: false
            });
        })
        .then(() => {
            // Step 4: Redirect the user after successful registration
            console.log('User registered and profile created in Firestore.');
            window.location.href = 'login.html'; // Or your login page
        })
        .catch((error) => {
            // Handle errors
            console.error("Registration Error: ", error);
            alert("Registration failed: " + error.message);
            submitButton.textContent = 'Register';
            submitButton.disabled = false;
        });
});
