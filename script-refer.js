document.addEventListener('DOMContentLoaded', () => {
  const referralCodeEl = document.getElementById('referralCode');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const totalReferralsEl = document.getElementById('totalReferrals');
  const totalEarningsEl = document.getElementById('totalEarnings');

  // Check if a user is logged in
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // User is signed in.
      const userId = user.uid;
      const db = firebase.firestore();
      
      // Fetch user data from Firestore
      db.collection('users').doc(userId).get().then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          
          // Display user's referral data
          referralCodeEl.textContent = userData.referralCode || 'N/A';
          totalReferralsEl.textContent = userData.totalReferrals || 0;
          totalEarningsEl.textContent = `₹${(userData.referralEarnings || 0).toFixed(2)}`;

        } else {
          console.log("No such document!");
          referralCodeEl.textContent = "Error";
        }
      }).catch(error => {
        console.error("Error getting document:", error);
        referralCodeEl.textContent = "Error";
      });

    } else {
      // No user is signed in. Redirect to login page.
      window.location.href = 'login.html';
    }
  });

  // Add functionality to the copy button
  copyCodeBtn.addEventListener('click', () => {
    const code = referralCodeEl.textContent;
    if (code && code !== 'Loading...' && code !== 'Error' && code !== 'N/A') {
      navigator.clipboard.writeText(code).then(() => {
        // Success feedback
        copyCodeBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyCodeBtn.textContent = 'Copy';
        }, 2000); // Revert back after 2 seconds
      }).catch(err => {
        console.error('Failed to copy text: ', err);
        alert('Failed to copy code.');
      });
    }
  });
});
