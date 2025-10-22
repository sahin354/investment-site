document.addEventListener('DOMContentLoaded', () => {
        
  // --- Main "Invite" / "My Earnings" Tab logic ---
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

  // --- "All" / "Joined" (Friends) Tab logic (FIXED) ---
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
  
  // --- Copy referral link functionality ---
  const copyLinkBtn = document.getElementById('copyReferralBtn');
  if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', () => {
          const referralLinkText = document.getElementById('referralLinkText').textContent;
          
          if (referralLinkText === 'Loading your link...') {
              alert('Please wait for your link to load.');
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
   * This uses the global 'firebase' object loaded by common.js
   */
  function loadReferralData() {
      firebase.auth().onAuthStateChanged(user => {
          if (user) {
              // User is signed in.
              // === UPDATE THIS DOMAIN to your real website ===
              const uniqueLink = `https://sahin354.github.io/inv/register.html?ref=${user.uid}`;
              
              // Update the text on the page
              const linkElement = document.getElementById('referralLinkText');
              if (linkElement) {
                  linkElement.textContent = uniqueLink;
              }
              
              // You can also load your friend lists here
              // loadAllFriends(user.uid);
              // loadJoinedFriends(user.uid);

          } else {
              // User is not logged in
              const linkElement = document.getElementById('referralLinkText');
              if (linkElement) {
                  linkElement.textContent = 'Error: Not logged in.';
              }
          }
      });
  }
  
  // Load the referral link
  loadReferralData();

  // NOTE: The sidebar logic (menuBtn, closeBtn) is in your
  // common.js file, so it doesn't need to be repeated here.
});
