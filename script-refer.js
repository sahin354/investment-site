// This script handles the referral page: displaying team stats and the referral link.
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();
    const level1CountEl = document.getElementById('level1Count');
    const level1ListEl = document.getElementById('level1List');

    auth.onAuthStateChanged(user => {
        if (user) {
            db.collection('users').doc(user.uid).get().then(doc => {
                if (doc.exists) {
                    fetchTeamData(db, doc.data().referralCode);
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    async function fetchTeamData(db, userReferralCode) {
        const level1Query = db.collection('users').where('referredBy', '==', userReferralCode);
        
        level1Query.onSnapshot(snapshot => {
            level1CountEl.textContent = snapshot.size;
            level1ListEl.innerHTML = ''; 
            
            if (snapshot.empty) {
                level1ListEl.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">You have no referrals yet.</p>';
                return;
            }

            snapshot.forEach(doc => {
                const referee = doc.data();
                let statusText = `<span class="recharge-status not-recharged">Not Recharged</span>`;
                if (referee.totalRechargeAmount > 0) {
                    statusText = `<span class="recharge-status recharged">₹${referee.totalRechargeAmount}</span>`;
                }
                const listItem = `<div class="team-list-item"><span>${referee.phone}</span>${statusText}</div>`;
                level1ListEl.innerHTML += listItem;
            });
        });
    }
    // ... (Rest of the script: tab logic, copy button, etc.) ...
});
