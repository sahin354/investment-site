// Tabbed Referral System - Exactly like screenshot
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // DOM Elements
    const totalRewardEl = document.getElementById('total-reward');
    const availableRewardEl = document.getElementById('available-reward');
    const lockedRewardEl = document.getElementById('locked-reward');
    const totalReferralsCountEl = document.getElementById('total-referrals-count');
    const redeemBtn = document.getElementById('redeem-btn');
    
    // Modal Elements
    const redeemModal = document.getElementById('redeemModal');
    const successModal = document.getElementById('successModal');
    const redeemAmountEl = document.getElementById('redeemAmount');
    const successMessageEl = document.getElementById('successMessage');

    // Friend List Elements
    const friendListEl = document.getElementById('friend-list');
    const friendTabs = document.querySelectorAll('.friend-tab');

    // Tab Elements
    const mainTabs = document.querySelectorAll('.main-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    let currentUserData = null;
    let userReferralCode = '';
    let allFriends = [];

    // Update time
    function updateTime() {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        document.getElementById('currentTime').textContent = `${hours}:${minutes}`;
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    currentUserData = doc.data();
                    userReferralCode = currentUserData.referralCode;
                    
                    // Initialize referral link
                    const referralLinkEl = document.getElementById('referralLink');
                    referralLinkEl.textContent = `${window.location.origin}?ref=${userReferralCode}`;
                    
                    // Load all data
                    updateTime();
                    setInterval(updateTime, 60000);
                    calculateEarnings(user.uid);
                    loadFriendData(userReferralCode);
                    setupEventListeners();
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // Load friend data from referrals
    async function loadFriendData(userReferralCode) {
        try {
            // Get level 1 referrals
            const level1Query = await db.collection('users')
                .where('referredBy', '==', userReferralCode)
                .get();

            allFriends = [];
            
            level1Query.forEach(doc => {
                const friend = doc.data();
                allFriends.push({
                    name: friend.name || 'User',
                    phone: friend.phone,
                    status: friend.totalRechargeAmount > 0 ? 'joined' : 'invited',
                    rechargeAmount: friend.totalRechargeAmount || 0
                });
            });

            // Update total referrals count
            totalReferralsCountEl.textContent = allFriends.length;

            // Load initial friend list
            loadFriendList('all');

        } catch (error) {
            console.error('Error loading friend data:', error);
        }
    }

    // Load friend list based on filter
    function loadFriendList(filter) {
        friendListEl.innerHTML = '';
        
        const filteredFriends = allFriends.filter(friend => {
            if (filter === 'all') return true;
            if (filter === 'joined') return friend.status === 'joined';
            return false;
        });

        if (filteredFriends.length === 0) {
            friendListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No friends found</p>';
            return;
        }

        filteredFriends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            
            const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            friendItem.innerHTML = `
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-phone">${friend.phone}</div>
                </div>
                <button class="invite-btn ${friend.status === 'joined' ? 'joined' : ''}">
                    ${friend.status === 'joined' ? 'Joined' : 'Invite 💹'}
                </button>
            `;
            
            friendListEl.appendChild(friendItem);
        });
    }

    // Calculate earnings based on team activity
    async function calculateEarnings(userId) {
        try {
            const userDoc = db.collection('users').doc(userId);
            const userData = (await userDoc.get()).data();
            
            // Get all team members across levels
            const level1Members = await db.collection('users')
                .where('referredBy', '==', userData.referralCode)
                .get();
            
            let level2Members = [];
            let level3Members = [];
            
            // Calculate level 2 and 3 members
            for (const level1Doc of level1Members.docs) {
                const level1Data = level1Doc.data();
                const level2 = await db.collection('users')
                    .where('referredBy', '==', level1Data.referralCode)
                    .get();
                level2Members.push(...level2.docs);
                
                for (const level2Doc of level2.docs) {
                    const level2Data = level2Doc.data();
                    const level3 = await db.collection('users')
                        .where('referredBy', '==', level2Data.referralCode)
                        .get();
                    level3Members.push(...level3.docs);
                }
            }

            // Calculate earnings
            let totalEarnings = 0;
            let availableEarnings = 0;
            let lockedEarnings = 0;

            // Level 1: 20% commission
            level1Members.forEach(doc => {
                const member = doc.data();
                if (member.totalRechargeAmount > 0) {
                    const earnings = member.totalRechargeAmount * 0.20;
                    totalEarnings += earnings;
                    availableEarnings += earnings;
                }
            });

            // Level 2: 8% commission
            level2Members.forEach(doc => {
                const member = doc.data();
                if (member.totalRechargeAmount > 0) {
                    const earnings = member.totalRechargeAmount * 0.08;
                    totalEarnings += earnings;
                    availableEarnings += earnings;
                }
            });

            // Level 3: 1% commission
            level3Members.forEach(doc => {
                const member = doc.data();
                if (member.totalRechargeAmount > 0) {
                    const earnings = member.totalRechargeAmount * 0.01;
                    totalEarnings += earnings;
                    availableEarnings += earnings;
                }
            });

            // Update UI
            totalRewardEl.textContent = `₹${totalEarnings.toFixed(2)}`;
            availableRewardEl.textContent = `₹${availableEarnings.toFixed(2)}`;
            lockedRewardEl.textContent = `₹${lockedEarnings.toFixed(2)}`;
            redeemAmountEl.textContent = `₹${availableEarnings.toFixed(2)}`;

            // Update user document with earnings
            userDoc.update({
                'referralEarnings.total': totalEarnings,
                'referralEarnings.available': availableEarnings,
                'referralEarnings.locked': lockedEarnings,
                'referralEarnings.level1.count': level1Members.size,
                'referralEarnings.level2.count': level2Members.length,
                'referralEarnings.level3.count': level3Members.length
            }).catch(error => {
                console.log('Error updating earnings:', error);
            });

        } catch (error) {
            console.error('Error calculating earnings:', error);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Main tab switching
        mainTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                
                // Update tabs
                mainTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update content
                tabContents.forEach(content => content.classList.remove('active'));
                document.getElementById(`${tabId}Tab`).classList.add('active');
            });
        });

        // Friend tab switching
        friendTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                friendTabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                const tabType = this.getAttribute('data-friend-tab');
                loadFriendList(tabType);
            });
        });

        // Copy referral link
        document.getElementById('copyLinkBtn').addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink').textContent;
            navigator.clipboard.writeText(referralLink).then(() => {
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                setTimeout(() => {
                    this.textContent = originalText;
                }, 2000);
            });
        });

        // Redeem functionality
        redeemBtn.addEventListener('click', () => {
            const availableAmount = parseFloat(availableRewardEl.textContent.replace('₹', ''));
            if (availableAmount > 0) {
                redeemModal.style.display = 'flex';
            } else {
                alert('No available reward to redeem!');
            }
        });

        document.getElementById('cancelRedeem').addEventListener('click', () => {
            redeemModal.style.display = 'none';
        });

        document.getElementById('confirmRedeem').addEventListener('click', async () => {
            const availableAmount = parseFloat(availableRewardEl.textContent.replace('₹', ''));
            const user = auth.currentUser;
            
            try {
                // Update main balance
                const userDoc = db.collection('users').doc(user.uid);
                const userData = (await userDoc.get()).data();
                
                const newBalance = (userData.balance || 0) + availableAmount;
                
                await userDoc.update({
                    balance: newBalance,
                    'referralEarnings.available': 0,
                    'referralEarnings.total': parseFloat(totalRewardEl.textContent.replace('₹', '')) - availableAmount
                });

                // Update UI
                availableRewardEl.textContent = '₹0.00';
                totalRewardEl.textContent = `₹${(parseFloat(totalRewardEl.textContent.replace('₹', '')) - availableAmount).toFixed(2)}`;
                
                redeemModal.style.display = 'none';
                successMessageEl.textContent = `₹${availableAmount.toFixed(2)} has been added to your main balance!`;
                successModal.style.display = 'flex';
                
            } catch (error) {
                console.error('Error redeeming reward:', error);
                alert('Error redeeming reward. Please try again.');
            }
        });

        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            successModal.style.display = 'none';
        });

        // Close modals when clicking outside
        [redeemModal, successModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });

        // Search functionality
        const searchInput = document.querySelector('.search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const activeTab = document.querySelector('.friend-tab.active').getAttribute('data-friend-tab');
            
            const filteredFriends = allFriends.filter(friend => {
                const matchesSearch = friend.name.toLowerCase().includes(searchTerm) || 
                                    friend.phone.includes(searchTerm);
                const matchesTab = activeTab === 'all' || 
                                 (activeTab === 'joined' && friend.status === 'joined');
                
                return matchesSearch && matchesTab;
            });

            displayFilteredFriends(filteredFriends);
        });
    }

    function displayFilteredFriends(friends) {
        friendListEl.innerHTML = '';
        
        if (friends.length === 0) {
            friendListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No friends found</p>';
            return;
        }

        friends.forEach(friend => {
            const friendItem = document.createElement('div');
            friendItem.className = 'friend-item';
            
            const initials = friend.name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            friendItem.innerHTML = `
                <div class="friend-avatar">${initials}</div>
                <div class="friend-info">
                    <div class="friend-name">${friend.name}</div>
                    <div class="friend-phone">${friend.phone}</div>
                </div>
                <button class="invite-btn ${friend.status === 'joined' ? 'joined' : ''}">
                    ${friend.status === 'joined' ? 'Joined' : 'Invite 💹'}
                </button>
            `;
            
            friendListEl.appendChild(friendItem);
        });
    }
});
