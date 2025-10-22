// Refer & Earn Page JavaScript

document.addEventListener('DOMContentLoaded', () => {
  // Initialize the application
  initApp();
});

function initApp() {
  // Initialize all functionality
  initSidebar();
  initMainTabs();
  initFriendTabs();
  initCopyReferral();
  initWhatsAppInvites();
  initSearchFriends();
  initRedeemButton();
  loadUserData();
  loadFriendsData();
}

// Sidebar functionality
function initSidebar() {
  const menuBtn = document.getElementById('menuBtn');
  const sideMenu = document.getElementById('sideMenu');
  const closeBtn = document.getElementById('closeBtn');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      sideMenu.classList.add('active');
      sidebarOverlay.classList.add('active');
    });
  }
  
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sideMenu.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', () => {
      sideMenu.classList.remove('active');
      sidebarOverlay.classList.remove('active');
    });
  }
  
  // Sidebar button actions
  const sidebarButtons = document.querySelectorAll('.sidebar-btn');
  sidebarButtons.forEach(button => {
    button.addEventListener('click', function() {
      const buttonText = this.textContent.trim();
      handleSidebarAction(buttonText);
    });
  });
}

function handleSidebarAction(action) {
  switch(action) {
    case 'Customer Support':
      showToast('Opening customer support...');
      // In a real app, this would open a support chat or dial a number
      setTimeout(() => {
        window.open('tel:+1234567890');
      }, 500);
      break;
    case 'Telegram Channel':
      showToast('Opening Telegram channel...');
      window.open('https://t.me/example', '_blank');
      break;
    case 'Settings':
      showToast('Opening settings...');
      // In a real app, this would navigate to settings page
      break;
    default:
      console.log('Sidebar action:', action);
  }
  
  // Close sidebar after action
  document.getElementById('sideMenu').classList.remove('active');
  document.getElementById('sidebarOverlay').classList.remove('active');
}

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
        
        // If switching to earnings tab, refresh earnings data
        if (tab.dataset.tab === 'earnings') {
          refreshEarningsData();
        }
      }
    });
  });
}

// Refresh earnings data (simulated)
function refreshEarningsData() {
  // In a real app, this would fetch data from an API
  const totalReward = document.querySelector('#earnings .earnings-item:nth-child(1) .earnings-amount');
  const availableReward = document.querySelector('#earnings .earnings-item:nth-child(2) .earnings-amount');
  const lockedReward = document.querySelector('#earnings .earnings-item:nth-child(3) .earnings-amount');
  
  if (totalReward) totalReward.textContent = '₹125.50';
  if (availableReward) availableReward.textContent = '₹75.50';
  if (lockedReward) lockedReward.textContent = '₹50.00';
  
  showToast('Earnings data updated');
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
    });
  });
}

// Copy referral link functionality
function initCopyReferral() {
  const copyLinkBtn = document.getElementById('copyReferralBtn');
  
  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      const referralLinkText = document.getElementById('referralLinkText').textContent;
      
      if (referralLinkText === 'Loading your link...') {
        showToast('Please wait for your link to load.', true);
        return;
      }
      
      // Use modern clipboard API
      navigator.clipboard.writeText(referralLinkText).then(() => {
        // Show success feedback
        copyLinkBtn.textContent = 'Copied!';
        copyLinkBtn.classList.add('copied');
        
        showToast('Referral link copied to clipboard!');
        
        // Reset button after 2 seconds
        setTimeout(() => {
          copyLinkBtn.textContent = 'Copy';
          copyLinkBtn.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy link: ', err);
        
        // Fallback for older browsers
        fallbackCopyText(referralLinkText);
      });
    });
  }
}

// Fallback copy method for older browsers
function fallbackCopyText(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('Referral link copied!');
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
  // Event delegation for dynamically loaded friend items
  document.addEventListener('click', function(e) {
    if (e.target.closest('.invite-btn-simple')) {
      const button = e.target.closest('.invite-btn-simple');
      const friendItem = button.closest('.friend-item');
      const friendName = friendItem.querySelector('.friend-name').textContent;
      const referralLink = document.getElementById('referralLinkText').textContent;
      
      // Create personalized message
      const message = `Hi ${friendName}! Join me on this amazing platform and let's earn together. Use my referral link: ${referralLink}`;
      
      // Open WhatsApp with pre-filled message
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      showToast(`Opening WhatsApp to invite ${friendName}`);
      
      // Track the invite
      trackFriendInvite(friendName);
    }
  });
}

// Track friend invite (simulated)
function trackFriendInvite(friendName) {
  // In a real app, this would send data to your backend
  console.log(`Invite sent to: ${friendName}`);
  
  // Update local storage to track invites
  const invitedFriends = JSON.parse(localStorage.getItem('invitedFriends') || '[]');
  if (!invitedFriends.includes(friendName)) {
    invitedFriends.push(friendName);
    localStorage.setItem('invitedFriends', JSON.stringify(invitedFriends));
  }
}

// Search friends functionality
function initSearchFriends() {
  const searchInput = document.getElementById('searchFriends');
  
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      const searchTerm = this.value.toLowerCase();
      const activeFriendTab = document.querySelector('.friends-sub-tab-button.active').dataset.friendTab;
      const friendList = document.getElementById(`${activeFriendTab}FriendList`);
      
      if (friendList) {
        const friendItems = friendList.querySelectorAll('.friend-item');
        let hasVisibleItems = false;
        
        friendItems.forEach(item => {
          const friendName = item.querySelector('.friend-name').textContent.toLowerCase();
          const friendPhone = item.querySelector('.friend-phone').textContent;
          
          if (friendName.includes(searchTerm) || friendPhone.includes(searchTerm)) {
            item.style.display = 'flex';
            hasVisibleItems = true;
          } else {
            item.style.display = 'none';
          }
        });
        
        // Show empty state if no results
        const emptyState = friendList.querySelector('.empty-state');
        if (!hasVisibleItems && !emptyState) {
          const emptyDiv = document.createElement('div');
          emptyDiv.className = 'empty-state';
          emptyDiv.innerHTML = `
            <i class="fas fa-search"></i>
            <p>No friends found matching "${searchTerm}"</p>
          `;
          friendList.appendChild(emptyDiv);
        } else if (hasVisibleItems && emptyState) {
          emptyState.remove();
        }
      }
    });
  }
}

// Redeem button functionality
function initRedeemButton() {
  const redeemBtn = document.querySelector('.redeem-btn');
  
  if (redeemBtn) {
    redeemBtn.addEventListener('click', function() {
      const availableAmount = document.querySelector('#earnings .earnings-item:nth-child(2) .earnings-amount').textContent;
      
      if (availableAmount === '₹0.00') {
        showToast('No rewards available to redeem', true);
      } else {
        showToast(`Redeeming ${availableAmount}...`);
        // In a real app, this would process the redemption
        setTimeout(() => {
          showToast('Redemption successful! Amount will be credited within 24 hours.');
        }, 1500);
      }
    });
  }
}

// Load user data and generate referral link
function loadUserData() {
  // In a real app, this would come from Firebase or your backend
  const userId = '123456';
  const vipLevel = 'Silver';
  
  document.getElementById('sidebarId').textContent = `User ID: ${userId}`;
  document.getElementById('sidebarVIP').textContent = `VIP Level: ${vipLevel}`;
  
  // Update referral link with user ID
  const referralLink = `https://sahin354.github.io/inv/register.html?ref=${userId}`;
  
  // Simulate loading delay
  setTimeout(() => {
    document.getElementById('referralLinkText').textContent = referralLink;
  }, 1000);
}

// Load friends data
function loadFriendsData() {
  // Sample friends data (only non-joined friends in "All" tab)
  const allFriends = [
    { name: 'HM Hariram Manglaw', phone: '9980989304' },
    { name: 'SD Santu Dey', phone: '8985688909' },
    { name: 'MV Mauhet Verma', phone: '8943870809' },
    { name: 'AK Ankit Kumar', phone: '9876543210' },
    { name: 'RS Rohan Sharma', phone: '9876543211' },
    { name: 'PK Priya Singh', phone: '9876543212' }
  ];
  
  // Sample joined friends data (only shown in "Joined" tab)
  const joinedFriends = [
    { name: 'RJ Rajesh Jain', phone: '9876543213', earnings: '₹50' },
    { name: 'SM Smita Mehta', phone: '9876543214', earnings: '₹25' }
  ];
  
  // Render all friends (non-joined only)
  const allFriendList = document.getElementById('allFriendList');
  if (allFriendList) {
    allFriendList.innerHTML = '';
    
    if (allFriends.length === 0) {
      allFriendList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-users"></i>
          <p>No friends to display</p>
        </div>
      `;
    } else {
      allFriends.forEach(friend => {
        const friendItem = createFriendItem(friend, false);
        allFriendList.appendChild(friendItem);
      });
    }
  }
  
  // Render joined friends (only in joined tab)
  const joinedFriendList = document.getElementById('joinedFriendList');
  if (joinedFriendList) {
    joinedFriendList.innerHTML = '';
    
    if (joinedFriends.length === 0) {
      joinedFriendList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-user-check"></i>
          <p>No friends have joined yet</p>
          <p style="font-size: 0.9em; margin-top: 5px;">Invite friends to start earning!</p>
        </div>
      `;
    } else {
      joinedFriends.forEach(friend => {
        const friendItem = createFriendItem(friend, true);
        joinedFriendList.appendChild(friendItem);
      });
    }
  }
}

// Create friend item element
function createFriendItem(friend, isJoined) {
  const friendItem = document.createElement('div');
  friendItem.className = 'friend-item';
  
  if (isJoined) {
    friendItem.innerHTML = `
      <div class="friend-details">
        <div class="friend-name">${friend.name}</div>
        <div class="friend-phone">${friend.phone}</div>
        <div class="friend-status">Earned ${friend.earnings}</div>
      </div>
      <div class="status-badge">Joined</div>
    `;
  } else {
    friendItem.innerHTML = `
      <div class="friend-details">
        <div class="friend-name">${friend.name}</div>
        <div class="friend-phone">${friend.phone}</div>
      </div>
      <button class="invite-btn-simple">Invite <i class="fab fa-whatsapp"></i></button>
    `;
  }
  
  return friendItem;
}

// Toast notification system
function showToast(message, isError = false) {
  // Remove existing toasts
  const existingToasts = document.querySelectorAll('.toast');
  existingToasts.forEach(toast => toast.remove());
  
  // Create new toast
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  
  // Add error styling if needed
  if (isError) {
    toast.classList.add('error');
  }
  
  document.body.appendChild(toast);
  
  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  // Hide toast after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    
    // Remove from DOM after transition
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
                                                    }
