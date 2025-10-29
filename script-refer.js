document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Sidebar Controls ---
  const menuBtn = document.getElementById("menuBtn");
  const closeBtn = document.getElementById("closeBtn");
  const sideMenu = document.getElementById("sideMenu");
  const sidebarOverlay = document.getElementById("sidebarOverlay");

  const toggleSidebar = () => {
    sideMenu.classList.toggle("active");
    sidebarOverlay.classList.toggle("active");
  };

  menuBtn.addEventListener("click", toggleSidebar);
  closeBtn.addEventListener("click", toggleSidebar);
  sidebarOverlay.addEventListener("click", toggleSidebar);

  // --- 2. Main Tab Controls (Invite / My Earnings) ---
  const mainTabButtons = document.querySelectorAll(".refer-main-tabs .tab-button");
  const mainTabContents = document.querySelectorAll("main .tab-content");

  mainTabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = button.getAttribute("data-tab"); // e.g., "invite"

      // Update button active state
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show target content
      mainTabContents.forEach((content) => {
        if (content.id === targetTab) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });

  // --- 3. Friends Sub-Tab Controls (All / Joined) ---
  const friendTabButtons = document.querySelectorAll(".friends-sub-tabs .friends-sub-tab-button");
  const friendTabContents = document.querySelectorAll(".friends-tab-content");

  friendTabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = button.getAttribute("data-friend-tab"); // e.g., "all"

      // Update button active state
      friendTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Show target content
      friendTabContents.forEach((content) => {
        if (content.id === targetTab) {
          content.classList.add("active");
        } else {
          content.classList.remove("active");
        }
      });
    });
  });

  // --- 4. Toast Notification Function ---
  const toast = document.getElementById("toastNotification");

  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = "toast"; // Reset classes
    if (isError) {
      toast.classList.add("error");
    }
    toast.classList.add("show");

    // Hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // --- 5. Copy Referral Link ---
  const copyBtn = document.getElementById("copyReferralBtn");
  const linkText = document.getElementById("referralLinkText").textContent;

  copyBtn.addEventListener("click", () => {
    navigator.clipboard
      .writeText(linkText)
      .then(() => {
        showToast("Referral link copied!");
        copyBtn.textContent = "Copied!";
        copyBtn.classList.add("copied");
        setTimeout(() => {
          copyBtn.textContent = "Copy";
          copyBtn.classList.remove("copied");
        }, 2000);
      })
      .catch((err) => {
        showToast("Failed to copy link.", true);
        console.error("Failed to copy: ", err);
      });
  });

  // --- 6. (NEW) Load Referrals Functionality ---
  const allListContainer = document.getElementById("allFriendList");
  const joinedListContainer = document.getElementById("joinedFriendList");

  // HTML for empty lists (using your CSS classes)
  const allEmptyHTML = `
    <div class="empty-state">
      <i class="fas fa-user-plus"></i>
      <p>You haven't referred anyone yet.</p>
    </div>`;
  const joinedEmptyHTML = `
    <div class="empty-state">
      <i class="fas fa-users"></i>
      <p>None of your friends have joined (recharged) yet.</p>
    </div>`;

  /**
   * Creates the simple HTML for a single friend card.
   * This matches your request for "name and phone only".
   */
  function createFriendCardHTML(friend) {
    return `
      <div class="friend-item" data-name="${friend.name.toLowerCase()}">
          <div class="friend-info">
              <span class="friend-name">${friend.name}</span>
              <span class="friend-phone">${friend.phone}</span>
          </div>
      </div>
    `;
  }

  /**
   * Fetches data from your API and builds the two lists.
   */
  async function loadReferrals() {
    try {
      // ** IMPORTANT **
      // This API endpoint MUST exist on your backend.
      // It must return JSON like:
      // [ { "name": "John Doe", "phone": "123456", "has_recharged": true },
      //   { "name": "Jane Smith", "phone": "654321", "has_recharged": false } ]
      const response = await fetch("/api/me/referrals"); // <--- YOUR API URL HERE

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const allReferrals = await response.json();

      // Clear loading message
      allListContainer.innerHTML = "";
      joinedListContainer.innerHTML = "";

      // Filter to find "Joined" friends (who have recharged)
      const joinedReferrals = allReferrals.filter(
        (friend) => friend.has_recharged === true
      );

      // --- Populate "All Referrals" List ---
      if (allReferrals.length === 0) {
        allListContainer.innerHTML = allEmptyHTML;
      } else {
        allReferrals.forEach((friend) => {
          allListContainer.innerHTML += createFriendCardHTML(friend);
        });
      }

      // --- Populate "Joined" List ---
      if (joinedReferrals.length === 0) {
        joinedListContainer.innerHTML = joinedEmptyHTML;
      } else {
        joinedReferrals.forEach((friend) => {
          joinedListContainer.innerHTML += createFriendCardHTML(friend);
        });
      }
    } catch (error) {
      console.error("Failed to load referrals:", error);
      const errorMsg = `<div class="empty-state"><p>Error loading friends.</p></div>`;
      allListContainer.innerHTML = errorMsg;
      joinedListContainer.innerHTML = errorMsg;
    }
  }

  // --- 7. (NEW) Search Functionality ---
  const searchInput = document.getElementById("searchFriends");

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    // Find which tab content is currently active
    const activeTabPane = document.querySelector(".friends-tab-content.active");
    if (!activeTabPane) return;

    const friends = activeTabPane.querySelectorAll(".friend-item");
    let foundOne = false;

    friends.forEach((friend) => {
      const name = friend.dataset.name || ""; // Get name from data-name attribute
      if (name.includes(searchTerm)) {
        friend.style.display = "flex"; // Show if matches
        foundOne = true;
      } else {
        friend.style.display = "none"; // Hide if no match
      }
    });

    // Optional: Show a "not found" message
    const emptyState = activeTabPane.querySelector('.empty-state');
    if(emptyState) emptyState.style.display = 'none'; // Hide empty state while searching

    // (This part is extra, you can remove if not needed)
    let noResultsMsg = activeTabPane.querySelector('.no-results');
    if (!foundOne && friends.length > 0) {
      if (!noResultsMsg) {
        noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'empty-state no-results';
        noResultsMsg.innerHTML = `<p>No friends found matching "${searchTerm}".</p>`;
        activeTabPane.appendChild(noResultsMsg);
      }
      noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
      noResultsMsg.style.display = 'none';
    }
    // If search is empty, show empty state again if it was there
    if(searchTerm === '' && emptyState) emptyState.style.display = 'block';

  });

  // --- Load the friend lists when the page starts ---
  loadReferrals();
});
                                
