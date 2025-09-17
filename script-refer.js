// This script handles the referral page: displaying team stats and the referral link.
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();
    const teamTabs = document.querySelectorAll('.team-tab');
    const teamContents = document.querySelectorAll('.team-level-content');
    const level1CountEl = document.getElementById('level1Count');
    const level1ListEl = document.getElementById('level1List');

    // ... (Your other element selections like referralLink and copyLinkBtn)

    teamTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            teamTabs.forEach(t => t.classList.remove('active'));
            teamContents.forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const contentId = `level${tab.dataset.level}Content`;
            document.getElementById(contentId).classList.add('active');
        });
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const referralCode = userData.referralCode;
                    // ... (Your referral link logic)
                    fetchTeamData(db, referralCode);
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    async function fetchTeamData(db, userReferralCode) {
        // --- THIS IS THE UPDATED LOGIC FOR LEVEL 1 ---
        const level1Query = db.collection('users').where('referredBy', '==', userReferralCode);
        
        level1Query.onSnapshot(snapshot => {
            level1CountEl.textContent = snapshot.size;
            level1ListEl.innerHTML = ''; // Clear the list
            
            if (snapshot.empty) {
                level1ListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">You have no referrals in this level.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const referee = doc.data();
                
                let statusText;
                if (referee.totalRechargeAmount > 0) {
                    statusText = `<span class="recharge-status recharged">₹${referee.totalRechargeAmount}</span>`;
                } else {
                    statusText = `<span class="recharge-status not-recharged">Not Recharged</span>`;
                }
                
                const listItem = `
                    <div class="team-list-item">
                        <span>${referee.phone}</span>
                        ${statusText}
                    </div>
                `;
                level1ListEl.innerHTML += listItem;
            });
        }, error => {
            console.error("Error fetching team data:", error);
            level1ListEl.innerHTML = '<p style="text-align: center; color: red;">Could not load team data.</p>';
        });
        
        // You can add count logic for Level 2 and 3 here later
    }
    
    // ... (Your existing, working copy button logic)
});
