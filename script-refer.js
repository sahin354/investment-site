document.addEventListener('DOMContentLoaded', () => {
  // Get elements from the DOM
  const referralLinkEl = document.getElementById('referralLink');
  const copyLinkBtn = document.getElementById('copyLinkBtn');
  const copyBtnText = document.getElementById('copyBtnText');
  const totalReferralsEl = document.getElementById('totalReferrals');
  const totalEarningsEl = document.getElementById('totalEarnings');

  // Check for logged-in user
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      const userId = user.uid;
      const db = firebase.firestore();

      // Fetch user data from the 'users' collection
      db.collection('users').doc(userId).get().then(doc => {
        if (doc.exists) {
          const userData = doc.data();
          const referralCode = userData.referralCode || 'NOT-FOUND';

          // Construct the full referral link
          const baseUrl = window.location.origin + window.location.pathname.replace('refer.html', 'register.html');
          const fullLink = `${baseUrl}?ref=${referralCode}`;
          referralLinkEl.textContent = fullLink;

          // Populate stats
          totalReferralsEl.textContent = userData.totalReferrals || 0;
          totalEarningsEl.textContent = `₹${(userData.referralEarnings || 0).toFixed(2)}`;

        } else {
          console.error("User document not found!");
          referralLinkEl.textContent = "Could not generate link.";
        }
      }).catch(error => {
        console.error("Error getting user document:", error);
        referralLinkEl.textContent = "Error loading link.";
      });

    } else {
      // If no user is signed in, redirect to the login page
      window.location.href = 'login.html';
    }
  });

  // Add click event to the copy button
  copyLinkBtn.addEventListener('click', () => {
    const linkToCopy = referralLinkEl.textContent;

    if (linkToCopy && !linkToCopy.includes('...')) {
      navigator.clipboard.writeText(linkToCopy).then(() => {
        // Provide visual feedback on success
        copyBtnText.textContent = 'Copied!';
        copyLinkBtn.style.backgroundColor = '#d1e7dd'; // A light green success color
        
        setTimeout(() => {
          // Revert back to the original state after 2 seconds
          copyBtnText.textContent = 'Copy';
          copyLinkBtn.style.backgroundColor = ''; // Reverts to CSS color
        }, 2000);

      }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Could not copy the link.');
      });
    }
  });
});

