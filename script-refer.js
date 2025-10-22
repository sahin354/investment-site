// Refer & Earn Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all functionality for this page
  initReferPage();
});

function initReferPage() {
  // Initialize Sidebar (if needed, otherwise handled by common.js)
  // initSidebar(); // Assuming common.js handles this now

  // Initialize page-specific elements and listeners
  initMainTabs();
  initFriendTabs();
  initCopyReferral();
  initWhatsAppInvites();
  initSearchFriends();
  initRedeemButton();

  // Load dynamic data (referral link, earnings, friends)
  loadUserData(); // Loads placeholder data and referral link
  // You would replace loadUserData with your actual Firebase loading functions
  // loadFirebaseData(); 
}

// Sidebar functionality (if common.js doesn't handle it)
/* function initSidebar() {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('closeBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  // Add event listeners as in your script-refer.js
  // ... (use code from script-refer.js if needed) ...
} 
*/

// Main "Invite" / "My Earnings" Tab functionality
function initMainTabs() {
  const referMainTabs = document.querySelectorAll('.refer-main-tabs .tab-button');
  const mainContents = document.querySelectorAll('.refer-page-container > .tab-content');

  referMainTabs.forEach(tab => {
    tab.addEventListener('click', (e) => { 
      e.preventDefault();
      
      // Update active tab
      referMainTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      mainContents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(tab.dataset.tab);
      if (targetContent) {
        targetContent.classList.add('active');
        
        // If switching to earnings tab, maybe refresh data (optional)
        if (tab.dataset.tab === 'earnings') {
          // refreshEarningsData(); // You might call your Firebase listener setup here
        }
      }
    });
  });
}

// "All" / "Joined" (Friends) Tab functionality
function initFriendTabs() {
  const friendsSubTabs = document.querySelectorAll('.friends-sub-tabs .friends-sub-tab-button');
  const friendsTabContents = document.querySelectorAll('.friends-tab-content');

  friendsSubTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      e.preventDefault(); 
      
      // Update active tab
      friendsSubTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show corresponding content
      friendsTabContents.forEach(c => c.classList.remove('active'));
      const targetContent = document.getElementById(tab.dataset.friendTab);
      if (targetContent) targetContent.classList.add('active');

      // Clear search when switching tabs
      const searchInput = document.getElementById('searchFriendsInput');
      if(searchInput) searchInput.value = '';
      filterFriends(''); // Show all friends in the new tab
    });
  });
}

// Copy referral link functionality
function initCopyReferral() {
  const copyLinkBtn = document.getElementById('copyReferralBtn');
  const referralLinkEl = document.getElementById('referralLinkText'); // Get the span

  if (copyLinkBtn && referralLinkEl) {
    copyLinkBtn.addEventListener('click', () => {
      const referralLinkText = referralLinkEl.textContent; // Get text from span
      
      if (referralLinkText === 'Loading your link...') {
         alert('Link is still loading, please wait.');
         return;
      }
      
      // Use modern clipboard API
      navigator.clipboard.writeText(referralLinkText).then(() => {
        // Show success feedback
        const originalText = copyLinkBtn.textContent;
        copyLinkBtn.textContent = 'Copied!';
        copyLinkBtn.classList.add('copied'); // Use class for styling
        
        showToast('Referral link copied!');
        
        // Reset button after 2 seconds
        setTimeout(() => {
          copyLinkBtn.textContent = originalText;
          copyLinkBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        // Fallback for older browsers or if permissions fail
        fallbackCopyText(referralLinkText); 
      });
    });
  }
}

// Fallback copy method
function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  // Make it non-visible
  textArea.style.position = 'fixed';
  textArea.style.top = '-9999px';
  textArea.style.left = '-9999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('Referral link copied!');
      // Update button state if needed (similar to above)
      const copyLinkBtn = document.getElementById('copyReferralBtn');
      if (copyLinkBtn) {
          const originalText = copyLinkBtn.textContent;
          copyLinkBtn.textContent = 'Copied!';
          copyLinkBtn.classList.add('copied');
          setTimeout(() => {
            copyLinkBtn.textContent = originalText;
            copyLinkBtn.classList.remove('copied');
          }, 2000);
      }
    } else {
      showToast('Failed to copy link. Please copy manually.', true);
    }
  } catch (err) {
    console.error('Fallback copy failed: ', err);
    showToast('Failed to copy link. Please copy manually.', true);
  }
  
  document.body.removeChild(textArea);
}


// WhatsApp invite functionality
function initWhatsAppInvites() {
  // Use event delegation on the list containers for potentially dynamic content
  const allFriendList = document.getElementById('allFriendList');
  
  if (allFriendList) {
      allFriendList.addEventListener('click', function(event) {
          if (event.target.closest('.invite-btn-simple')) {
              const button = event.target.closest('.invite-btn-simple');
              const friendItem = button.closest('.friend-item');
              const friendName = friendItem.querySelector('.friend-name').textContent;
              const referralLink = document.getElementById('referralLinkText').textContent;

              if (referralLink === 'Loading your link...') {
                   alert('Please wait for your link to load before inviting.');
                   return;
              }
              
              // Create personalized message
              const message = `Hi ${friendName}! Join me on this amazing platform and let's earn together. Use my referral link: ${referralLink}`;
              
              // Open WhatsApp with pre-filled message
              const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
              window.open(whatsappUrl, '_blank');
              
              showToast(`Opening WhatsApp to invite ${friendName}`);
          }
      });
  }
}

// Search friends functionality
function initSearchFriends() {
  const searchInput = document.getElementById('searchFriendsInput');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase().trim();
      filterFriends(searchTerm);
    });
  }
}

// Helper function to filter friends based on search term
function filterFriends(searchTerm) {
    const activeFriendTab = document.querySelector('.friends-sub-tab-button.active')?.dataset.friendTab;
    if (!activeFriendTab) return; // Exit if no active tab found

    const friendList = document.getElementById(`${activeFriendTab}FriendList`);
    
    if (friendList) {
        const friendItems = friendList.querySelectorAll('.friend-item');
        let visibleCount = 0;
        
        friendItems.forEach(item => {
          const friendNameEl = item.querySelector('.friend-name');
          const friendPhoneEl = item.querySelector('.friend-phone');
          
          // Ensure elements exist before accessing textContent
          const friendName = friendNameEl ? friendNameEl.textContent.toLowerCase() : '';
          const friendPhone = friendPhoneEl ? friendPhoneEl.textContent : ''; // No need for lowercase on phone

          // Check if name or phone includes the search term
          const isMatch = (friendName.includes(searchTerm) || friendPhone.includes(searchTerm));
          
          if (isMatch) {
            item.style.display = 'flex'; // Use 'flex' as defined in CSS
            visibleCount++;
          } else {
            item.style.display = 'none';
          }
        });

        // Optional: Show a message if no results found
        // You might need a dedicated element for this message
        const noResultsMessage = friendList.querySelector('.no-results-message'); 
        if (visibleCount === 0 && friendItems.length > 0) {
            if (!noResultsMessage) {
                const p = document.createElement('p');
                p.className = 'no-results-message'; // Add a class for styling
                p.textContent = 'No matching friends found.';
                p.style.textAlign = 'center';
                p.style.color = '#888';
                p.style.padding = '20px 0';
                friendList.appendChild(p);
            } else {
                noResultsMessage.style.display = 'block';
            }
        } else if (noResultsMessage) {
            noResultsMessage.style.display = 'none'; // Hide if results are found
        }
    }
}


// Redeem button functionality
function initRedeemButton() {
  const redeemBtn = document.getElementById('redeemBtn');
  
  if (redeemBtn) {
    redeemBtn.addEventListener('click', function() {
      const availableAmountEl = document.getElementById('availableRewardAmount');
      const availableAmountText = availableAmountEl ? availableAmountEl.textContent : '₹0.00';
      
      // Extract number from the text (e.g., "₹75.50" -> 75.50)
      const amountValue = parseFloat(availableAmountText.replace('₹', ''));

      if (isNaN(amountValue) || amountValue <= 0) {
        showToast('No rewards available to redeem', true);
      } else {
        showToast(`Redeeming ${availableAmountText}...`);
        // !! IMPORTANT !!
        // In a real app, this should trigger a Firebase Cloud Function
        // to securely process the redemption on the server.
        // Never trust the client-side amount.
        console.log("Triggering Cloud Function for redemption (simulation)"); 
        
        // Simulate success/failure after backend call
        setTimeout(() => {
          // Assume success for demo
          showToast('Redemption successful! Amount will be credited.'); 
          // You would update the UI based on the *actual* result from the Cloud Function
          // For example, fetch updated reward amounts.
        }, 1500);
      }
    });
  }
}

// Toast notification system
function showToast(message, isError = false) {
  // Remove existing toasts quickly
  document.querySelectorAll('.toast').forEach(toast => toast.remove());
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  if (isError) {
    toast.style.backgroundColor = '#dc3545'; // Use a standard error color
  }
  
  document.body.appendChild(toast);
  
  // Force reflow to ensure transition works
  void toast.offsetWidth; 
  
  // Show toast
  toast.classList.add('show');
  
  // Hide and remove toast
  setTimeout(() => {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => {
       if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, { once: true }); // Remove after transition finishes
  }, 3000);
}

// Simulate loading user data (Replace with Firebase logic)
function loadUserData() {
    // This function now primarily focuses on the referral link,
    // assuming common.js handles sidebar info.
    // Use onAuthStateChanged to ensure Firebase is ready.
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const userId = user.uid; // Get the actual logged-in user's ID
            
            // Update referral link with user ID
            // === UPDATE DOMAIN ===
            const referralLink = `https://sahin354.github.io/inv/register.html?ref=${userId}`;
            const linkElement = document.getElementById('referralLinkText');
            if (linkElement) {
                linkElement.textContent = referralLink;
            }

            // TODO: Load actual earnings data from Firestore
            // Example: listenToUserRewards(userId);

            // TODO: Load actual friend lists from Firestore
            // Example: loadAllFriends(userId);
            // Example: loadJoinedFriends(userId);

        } else {
            // User not logged in (common.js should handle redirect)
            const linkElement = document.getElementById('referralLinkText');
            if (linkElement) {
                linkElement.textContent = 'Error: Not logged in.';
            }
        }
    });
}

// Placeholder functions for loading friends (replace with Firebase logic)
function loadAllFriends(userId) {
    console.log("Loading all friends for user:", userId);
    const listEl = document.getElementById('allFriendList');
    listEl.innerHTML = ''; // Clear example data
    // ... Add Firebase query and populate list ...
    // Example item:
    // listEl.innerHTML += `
    //   <div class="friend-item">
    //     <div class="friend-details">
    //       <div class="friend-name">Firestore Friend</div>
    //       <div class="friend-phone">111222333</div>
    //     </div>
    //     <button class="invite-btn-simple">Invite <i class="fab fa-whatsapp"></i></button>
    //   </div>`;
}

function loadJoinedFriends(userId) {
    console.log("Loading joined friends for user:", userId);
    const listEl = document.getElementById('joinedFriendList');
    listEl.innerHTML = ''; // Clear example data
    // ... Add Firebase query and populate list ...
    // Example item:
    // listEl.innerHTML += `
    //   <div class="friend-item">
    //     <div class="friend-details">
    //       <div class="friend-name">Firestore Joined</div>
    //       <div class="friend-phone">444555666</div>
    //       <div class="friend-status">Joined - ₹10 Earned</div>
    //     </div>
    //     <div class="status-badge">Joined</div>
    //   </div>`;
}

// Placeholder for real-time earnings listener (replace with Firebase logic)
function listenToUserRewards(userId) {
    console.log("Listening to rewards for user:", userId);
    const totalRewardEl = document.getElementById('totalRewardAmount');
    const availableRewardEl = document.getElementById('availableRewardAmount');
    const lockedRewardEl = document.getElementById('lockedRewardAmount');
    // ... Add Firebase onSnapshot listener ...
    // Inside the listener, update:
    // totalRewardEl.textContent = `₹${data.total.toFixed(2)}`;
    // availableRewardEl.textContent = `₹${data.available.toFixed(2)}`;
    // lockedRewardEl.textContent = `₹${data.locked.toFixed(2)}`;
        }
              
