// script-refer.js
auth.onAuthStateChanged(user => {
    if(user) {
        // Generate and display referral link
        const refLink = `${window.location.origin}/register.html?ref=${user.uid}`;
        document.getElementById('referralLink').value = refLink;

        // Count direct referrals (Level 1)
        db.collection('users').where('referredBy', '==', user.uid).get().then(snapshot => {
            document.getElementById('referralCount').textContent = snapshot.size;
        });
    }
});

// Copy button functionality
document.getElementById('copyBtn').addEventListener('click', () => {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    alert("Referral link copied!");
});
