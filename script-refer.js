// Enhanced Referral System with Earnings Tracking
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();
    
    // DOM Elements
    const level1CountEl = document.getElementById('level1Count');
    const level1ListEl = document.getElementById('level1List');
    const level2CountEl = document.getElementById('level2Count');
    const level2ListEl = document.getElementById('level2List');
    const level3CountEl = document.getElementById('level3Count');
    const level3ListEl = document.getElementById('level3List');
    
    // Earnings Elements
    const totalRewardEl = document.getElementById('total-reward');
    const availableRewardEl = document.getElementById('available-reward');
    const lockedRewardEl = document.getElementById('locked-reward');
    const redeemBtn = document.getElementById('redeem-btn');
    const myEarningsBtn = document.getElementById('myEarningsBtn');
    
    // Modal Elements
    const earningsModal = document.getElementById('earningsModal');
    const redeemModal = document.getElementById('redeemModal');
    const successModal = document.getElementById('successModal');
    const totalReferralsEl = document.getElementById('totalReferrals');
    const totalEarningsEl = document.getElementById('totalEarnings');
    const currentBonusEl = document.getElementById('currentBonus');
    const availableNowEl = document.getElementById('availableNow');
    const redeemAmountEl = document.getElementById('redeemAmount');
    const successMessageEl = document.getElementById('successMessage');

    let currentUserData = null;
    let userReferralCode = '';

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
                    fetchTeamData(db, userReferralCode);
                    calculateEarnings(user.uid);
                    setupEventListeners();
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // Fetch team data for all levels
    async function fetchTeamData(db, userReferralCode) {
        // Level 1 - Direct referrals
        const level1Query = db.collection('users').where('referredBy', '==', userReferralCode);
        
        level1Query.onSnapshot(snapshot => {
            level1CountEl.textContent = snapshot.size;
            level1ListEl.innerHTML = ''; 
            
            if (snapshot.empty) {
                level1ListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">You have no referrals yet.</p>';
            } else {
                snapshot.forEach(doc => {
                    const referee = doc.data();
                    displayTeamMember(level1ListEl, referee);
                });
            }
        });

        // Level 2 - Referrals of referrals
        const level2Members = await getLevelMembers(userReferralCode, 2);
        level2CountEl.textContent = level2Members.length;
        displayTeamList(level2ListEl, level2Members);

        // Level 3 - Third level referrals
        const level3Members = await getLevelMembers(userReferralCode, 3);
        level3CountEl.textContent = level3Members.length;
        displayTeamList(level3ListEl, level3Members);
    }

    // Recursive function to get level members
    async function getLevelMembers(referralCode, targetLevel, currentLevel = 1, collected = []) {
        if (currentLevel >= targetLevel) return collected;

        const directReferees = await db.collection('users')
            .where('referredBy', '==', referralCode)
            .get();

        for (const doc of directReferees.docs) {
            const referee = doc.data();
            if (currentLevel === targetLevel - 1) {
                collected.push(referee);
            }
            await getLevelMembers(referee.referralCode, targetLevel, currentLevel + 1, collected);
        }
        
        return collected;
    }

    function displayTeamList(container, members) {
        container.innerHTML = '';
        
        if (members.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No members at this level.</p>';
            return;
        }

        members.forEach(member => {
            displayTeamMember(container, member);
        });
    }

    function displayTeamMember(container, member) {
        let statusText = `<span class="recharge-status not-recharged">Not Recharged</span>`;
        if (member.totalRechargeAmount > 0) {
            statusText = `<span class="recharge-status recharged">₹${member.totalRechargeAmount}</span>`;
        }
        const listItem = `<div class="team-list-item"><span>${member.phone}</span>${statusText}</div>`;
        container.innerHTML += listItem;
    }

    // Calculate earnings based on team activity
    async function calculateEarnings(userId) {
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

        // Update earnings modal
        totalReferralsEl.textContent = level1Members.size + level2Members.length + level3Members.length;
        totalEarningsEl.textContent = `₹${totalEarnings.toFixed(2)}`;
        currentBonusEl.textContent = `₹${availableEarnings.toFixed(2)}`;
        availableNowEl.textContent = `₹${availableEarnings.toFixed(2)}`;
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
    }

    // Setup event listeners
    function setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.team-tab').forEach(tab => {
            tab.addEventListener('click', function() {
                document.querySelectorAll('.team-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.team-level-content').forEach(c => c.classList.remove('active'));
                
                this.classList.add('active');
                const level = this.getAttribute('data-level');
                document.getElementById(`level${level}Content`).classList.add('active');
            });
        });

        // Copy referral link
        document.getElementById('copyLinkBtn').addEventListener('click', function() {
            const referralLink = document.getElementById('referralLink').textContent;
            navigator.clipboard.writeText(referralLink).then(() => {
                const originalText = this.querySelector('span').textContent;
                this.querySelector('span').textContent = 'Copied!';
                setTimeout(() => {
                    this.querySelector('span').textContent = originalText;
                }, 2000);
            });
        });

        // My Earnings modal
        myEarningsBtn.addEventListener('click', () => {
            earningsModal.style.display = 'flex';
        });

        document.getElementById('closeEarningsModal').addEventListener('click', () => {
            earningsModal.style.display = 'none';
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
        [earningsModal, redeemModal, successModal].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
    }
});
