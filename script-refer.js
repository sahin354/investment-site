// In script-refer.js
import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { doc, onSnapshot, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

// DOM Elements
const totalRewardEl = document.getElementById('total-reward');
const availableRewardEl = document.getElementById('available-reward');
const lockedRewardEl = document.getElementById('locked-reward');
const referralLinkEl = document.getElementById('referral-link');
const copyBtn = document.getElementById('copy-btn');
const friendsListEl = document.getElementById('friends-list');
const redeemBtn = document.getElementById('redeem-btn');

let currentUser = null;

// --- 1. Listen for Authentication Changes ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        // Start all real-time listeners for this user
        listenToUserRewards(user.uid);
        loadUserReferralCode(user.uid);
        loadUserReferrals(user.uid);
    } else {
        // User is signed out
        // Redirect them to the login page
        window.location.href = '/login.html';
    }
});

// --- 2. REAL-TIME Reward Listener ---
function listenToUserRewards(uid) {
    const userDocRef = doc(db, 'users', uid);

    // onSnapshot creates a REAL-TIME connection
    onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
            const userData = doc.data();
            const rewards = userData.rewards;

            // Update the HTML in real-time
            totalRewardEl.textContent = `₹${rewards.total.toFixed(2)}`;
            availableRewardEl.textContent = `₹${rewards.available.toFixed(2)}`;
            lockedRewardEl.textContent = `₹${rewards.locked.toFixed(2)}`;

            // Enable or disable redeem button
            if (rewards.available > 0) {
                redeemBtn.disabled = false;
            } else {
                redeemBtn.disabled = true;
            }

        } else {
            console.log("No such user document!");
        }
    });
}

// --- 3. Load User's Referral Code/Link ---
async function loadUserReferralCode(uid) {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef); // We only need to get this once
    
    if (userDoc.exists()) {
        const referralCode = userDoc.data().referralCode;
        // Create the full link
        const referLink = `${window.location.origin}/register.html?ref=${referralCode}`;
        referralLinkEl.value = referLink;
    }
}

// --- 4. Load the list of "Joined" friends ---
async function loadUserReferrals(uid) {
    // Find all referrals where this user was the referrer
    const q = query(collection(db, "referrals"), where("referrerId", "==", uid));
    const querySnapshot = await getDocs(q);

    friendsListEl.innerHTML = ''; // Clear the list first
    if (querySnapshot.empty) {
        friendsListEl.innerHTML = '<li>No friends have joined yet.</li>';
        return;
    }

    querySnapshot.forEach((doc) => {
        const referral = doc.data();
        // Mask the email for privacy (e.g., test@gmail.com -> t***t@gmail.com)
        const maskedEmail = referral.referredEmail.replace(/^(.)(.*)(.@.*)$/, 
            (_, a, b, c) => a + '*'.repeat(b.length) + c
        );

        const li = document.createElement('li');
        li.innerHTML = `
            ${maskedEmail}
            <span>${referral.status}</span>
        `;
        friendsListEl.appendChild(li);
    });
}

// --- 5. Add Event Listeners for Buttons ---

// Copy Button
copyBtn.addEventListener('click', () => {
    referralLinkEl.select();
    document.execCommand('copy');
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
});

// Redeem Button
redeemBtn.addEventListener('click', () => {
    // This is a more complex action.
    // You should NOT do this from the frontend for security.
    // You should call a Firebase Cloud Function to handle the redemption.
    alert('Redeem feature requires a Firebase Cloud Function to process securely.');
    // For now, we can just show it's clicked.
});

// Tab navigation
function openTab(tabName) {
    document.getElementById('invite').style.display = (tabName === 'invite') ? 'block' : 'none';
    document.getElementById('earnings').style.display = (tabName === 'earnings') ? 'block' : 'none';
    
    document.querySelector('.tab-link[onclick="openTab(\'invite\')"]').classList.toggle('active', tabName === 'invite');
    document.querySelector('.tab-link[onclick="openTab(\'earnings\')"]').classList.toggle('active', tabName === 'earnings');
}
// Make 'invite' tab active by default
openTab('invite');
// Make the functions globally accessible for the HTML onclick
window.openTab = openTab;

