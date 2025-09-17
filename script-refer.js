document.addEventListener('DOMContentLoaded', () => {
    // --- Existing Elements ---
    const referralLinkEl = document.getElementById('referralLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const copyBtnText = document.getElementById('copyBtnText');
    
    // --- New Team Elements ---
    const teamTabs = document.querySelectorAll('.team-tab');
    const teamContents = document.querySelectorAll('.team-level-content');
    const level1CountEl = document.getElementById('level1Count');
    const level2CountEl = document.getElementById('level2Count');
    const level3CountEl = document.getElementById('level3Count');
    
    // --- Tab Switching Logic ---
    teamTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            teamTabs.forEach(t => t.classList.remove('active'));
            teamContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const contentId = `level${tab.dataset.level}Content`;
            document.getElementById(contentId).classList.add('active');
        });
    });

    // --- Firebase Logic ---
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const db = firebase.firestore();
            const currentUserRef = db.collection('users').doc(user.uid);

            currentUserRef.get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    const referralCode = userData.referralCode;

                    // Update referral link (same as before)
                    const baseUrl = window.location.origin + window.location.pathname.replace('refer.html', 'register.html');
                    referralLinkEl.textContent = `${baseUrl}?ref=${referralCode}`;
                    
                    // Fetch team data
                    fetchTeamData(db, referralCode);
                }
            });
        } else {
            window.location.href = 'login.html';
        }
    });

    // --- Function to fetch all team data ---
    async function fetchTeamData(db, userReferralCode) {
        try {
            // Level 1: Users directly referred by the current user
            const level1Snapshot = await db.collection('users').where('referredBy', '==', userReferralCode).get();
            const level1Users = level1Snapshot.docs.map(doc => doc.data().referralCode).filter(Boolean);
            level1CountEl.textContent = level1Snapshot.size;

            if (level1Users.length === 0) {
                level2CountEl.textContent = 0;
                level3CountEl.textContent = 0;
                return;
            }

            // Level 2: Users referred by Level 1 members
            // Note: Firestore 'in' query is limited to 30 items. For larger scale, this requires a backend function.
            const level2Snapshot = await db.collection('users').where('referredBy', 'in', level1Users).get();
            const level2Users = level2Snapshot.docs.map(doc => doc.data().referralCode).filter(Boolean);
            level2CountEl.textContent = level2Snapshot.size;

            if (level2Users.length === 0) {
                level3CountEl.textContent = 0;
                return;
            }

            // Level 3: Users referred by Level 2 members
            const level3Snapshot = await db.collection('users').where('referredBy', 'in', level2Users).get();
            level3CountEl.textContent = level3Snapshot.size;

        } catch (error) {
            console.error("Error fetching team data:", error);
        }
    }
    
    // --- Copy Button Logic (same as before) ---
    copyLinkBtn.addEventListener('click', () => {
        // ... (The copy functionality code remains the same as my previous answer)
        const linkToCopy = referralLinkEl.textContent;
        if (linkToCopy && !linkToCopy.includes('...')) {
            navigator.clipboard.writeText(linkToCopy).then(() => {
                copyBtnText.textContent = 'Copied!';
                setTimeout(() => { copyBtnText.textContent = 'Copy'; }, 2000);
            });
        }
    });
});
                                                        
