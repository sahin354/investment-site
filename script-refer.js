document.addEventListener("DOMContentLoaded", () => {
  const db = firebase.firestore();
  let currentUserData = null; // Store current user's data
  let allReferrals = []; // Store the list of referred friends

  // --- 1. Main Tab Controls (Invite / My Earnings) ---
  const mainTabButtons = document.querySelectorAll(
    ".refer-main-tabs .tab-button"
  );
  const mainTabContents = document.querySelectorAll("main .tab-content");

  mainTabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = button.getAttribute("data-tab"); // e.g., "invite"
      mainTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      mainTabContents.forEach((content) => {
        content.id === targetTab
          ? content.classList.add("active")
          : content.classList.remove("active");
      });
    });
  });

  // --- 2. Friends Sub-Tab Controls (All / Joined) ---
  const friendTabButtons = document.querySelectorAll(
    ".friends-sub-tabs .friends-sub-tab-button"
  );
  const friendTabContents = document.querySelectorAll(".friends-tab-content");

  friendTabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      const targetTab = button.getAttribute("data-friend-tab"); // e.g., "all"
      friendTabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      friendTabContents.forEach((content) => {
        content.id === targetTab
          ? content.classList.add("active")
          : content.classList.remove("active");
      });
    });
  });

  // --- 3. Toast Notification Function ---
  const toast = document.getElementById("toastNotification");
  function showToast(message, isError = false) {
    toast.textContent = message;
    toast.className = "toast"; // Reset classes
    if (isError) {
      toast.classList.add("error");
    }
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // --- 4. Authentication and Data Loading ---
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is logged in, fetch their data
      loadUserData(user.uid);
    } else {
      // User is not logged in, handled by common.js
      console.log("User not logged in.");
    }
  });

  async function loadUserData(userId) {
    try {
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        throw new Error("User data not found");
      }
      currentUserData = userDoc.data();
      
      // Once we have user data, we can build the referral link and load friends
      initializeReferralLink(currentUserData.referralCode);
      loadReferrals(currentUserData.referralCode);
      
    } catch (error) {
      console.error("Error loading user data:", error);
      showToast("Error loading your data.", true);
    }
  }

  // --- 5. Initialize and Copy Referral Link ---
  const copyBtn = document.getElementById("copyReferralBtn");
  const linkTextElement = document.getElementById("referralLinkText");

  function initializeReferralLink(referralCode) {
    if (!referralCode) {
      linkTextElement.textContent = "Error: No referral code found.";
      copyBtn.disabled = true;
      return;
    }
    
    // This is the base URL from your original HTML file
    const baseURL = "https://sahin354.github.io/inv/register.html";
    const fullLink = `${baseURL}?ref=${referralCode}`;
    
    linkTextElement.textContent = fullLink;

    copyBtn.addEventListener("click", () => {
      navigator.clipboard
        .writeText(fullLink)
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
  }

  // --- 6. Load "All" and "Joined" Referrals ---
  const allListContainer = document.getElementById("allFriendList");
  const joinedListContainer = document.getElementById("joinedFriendList");

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

  function createFriendCardHTML(friend) {
    // We get the name from the data to use in the search filter
    return `
      <div class="friend-item" data-name="${friend.name.toLowerCase()}">
          <div class="friend-info">
              <span class="friend-name">${friend.name}</span>
              <span class="friend-phone">${friend.phone}</span>
          </div>
      </div>
    `;
  }

  async function loadReferrals(referralCode) {
    try {
      allListContainer.innerHTML = `<div class="loading-state">Loading...</div>`;
      joinedListContainer.innerHTML = `<div class="loading-state">Loading...</div>`;

      const snapshot = await db.collection("users")
        .where("referredBy", "==", referralCode)
        .get();
        
      allReferrals = snapshot.docs.map(doc => doc.data());

      // Clear loading messages
      allListContainer.innerHTML = "";
      joinedListContainer.innerHTML = "";

      // --- Populate "All Referrals" List ---
      if (allReferrals.length === 0) {
        allListContainer.innerHTML = allEmptyHTML;
      } else {
        allReferrals.forEach((friend) => {
          allListContainer.innerHTML += createFriendCardHTML(friend);
        });
      }

      // --- Populate "Joined" List ---
      // This works because we modified script-payment-approval.js
      const joinedReferrals = allReferrals.filter(
        (friend) => friend.totalRechargeAmount > 0
      );
      
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
      showToast("Could not load referral list.", true);
    }
  }

  // --- 7. Search Functionality (Unchanged from your file) ---
  const searchInput = document.getElementById("searchFriends");
  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const activeTabPane = document.querySelector(".friends-tab-content.active");
    if (!activeTabPane) return;

    const friends = activeTabPane.querySelectorAll(".friend-item");
    let foundOne = false;

    friends.forEach((friend) => {
      const name = friend.dataset.name || "";
      if (name.includes(searchTerm)) {
        friend.style.display = "flex";
        foundOne = true;
      } else {
        friend.style.display = "none";
      }
    });
    
    // Handle "No results" message
    let noResultsMsg = activeTabPane.querySelector(".no-results");
    if (!noResultsMsg) {
      noResultsMsg = document.createElement("div");
      noResultsMsg.className = "empty-state no-results";
      noResultsMsg.style.display = "none"; // Hide by default
      activeTabPane.appendChild(noResultsMsg);
    }
    
    if (!foundOne && friends.length > 0) {
        noResultsMsg.innerHTML = `<p>No friends found matching "${searchTerm}".</p>`;
        noResultsMsg.style.display = "block";
    } else {
        noResultsMsg.style.display = "none";
    }
    
    // Show/hide the main empty state
    const emptyState = activeTabPane.querySelector(".empty-state:not(.no-results)");
    if(emptyState) {
        emptyState.style.display = (searchTerm === "" && friends.length === 0) ? "block" : "none";
    }
    
  });
});
                                       
