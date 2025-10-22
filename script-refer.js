document.addEventListener('DOMContentLoaded', () => {
      
  // Main "Invite" / "My Earnings" Tab logic
  const referMainTabs = document.querySelectorAll('.refer-main-tabs .tab-button');
  const mainContents = document.querySelectorAll('.refer-page-container > .tab-content');

  referMainTabs.forEach(tab => {
    tab.addEventListener('click', (e) => { 
      e.preventDefault();
      referMainTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mainContents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) targetContent.classList.add('active');
    });
  });

  // "All" / "Joined" (Friends) Tab logic
  const friendsSubTabs = document.querySelectorAll('.friends-sub-tabs .friends-sub-tab-button');
  const friendsTabContents = document.querySelectorAll('.friends-tab-content');

  friendsSubTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault(); 
      friendsSubTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      friendsTabContents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(tab.dataset.friendTab);
      if (targetContent) targetContent.classList.add('active');
    });
  });
  
  // Copy referral link functionality
  const copyLinkBtn = document.getElementById('copyReferralBtn');
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      const referralLinkText = document.getElementById('referralLinkText').textContent;
      
      if (referralLinkText === 'Loading your link...') {
         alert('Link is still loading, please wait.');
         return;
      }
      
      navigator.clipboard.writeText(referralLinkText).then(() => {
        // Show feedback
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'Copied!';
        copyLinkBtn.style.backgroundColor = '#28a745'; // Green for success
        
        setTimeout(() => {
          copyLinkBtn.textContent = originalText;
          copyLinkBtn.style.backgroundColor = ''; // Revert to original color
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        alert('Failed to copy link');
      });
    });
  }
  
  /**
   * Function to load your unique referral link
   * This relies on the global 'firebase' object from common.js
   */
  function loadReferralData() {
      // Use onAuthStateChanged to make sure Firebase Auth is ready
      firebase.auth().onAuthStateChanged(user => {
          if (user) {
              // User is signed in.
              // === UPDATE THIS DOMAIN to your real website ===
              const uniqueLink = `https://sahin354.github.io/inv/register.html?ref=${user.uid}`;
              
              const linkElement = document.getElementById('referralLinkText');
              if (linkElement) {
                  linkElement.textContent = uniqueLink;
              }
              
              // TODO: You would also load your friend lists using Firebase here
              // For example:
              // loadAllFriends(user.uid);
              // loadJoinedFriends(user.uid);

          } else {
              // User is signed out. common.js will handle redirect.
              const linkElement = document.getElementById('referralLinkText');
              if (linkElement) {
                  linkElement.textContent = 'Error: Not logged in.';
              }
          }
      });
  }
  
  // Load the referral link data when the page loads
  loadReferralData();

  // NOTE: Sidebar functionality is handled by common.js
});
