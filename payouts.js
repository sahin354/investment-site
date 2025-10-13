// Daily income calculation system
function processDailyPayouts() {
    const investmentsRef = firebase.firestore().collection('userInvestments');
    const now = new Date();
    
    investmentsRef.where('isActive', '==', true).get().then((snapshot) => {
        snapshot.forEach(doc => {
            const investment = doc.data();
            const lastPayout = investment.nextPayout ? investment.nextPayout.toDate() : investment.startDate.toDate();
            
            // Check if 24 hours have passed since last payout
            if (now - lastPayout >= 24 * 60 * 60 * 1000) {
                const daysCompleted = investment.completedDays + 1;
                const totalEarned = investment.totalEarned + investment.dailyIncome;
                
                // Update investment
                investmentsRef.doc(doc.id).update({
                    completedDays: daysCompleted,
                    totalEarned: totalEarned,
                    nextPayout: new Date(now.getTime() + 24 * 60 * 60 * 1000), // Next payout in 24 hours
                    isActive: daysCompleted < investment.totalDays
                }).then(() => {
                    // Add income to user balance
                    if (daysCompleted < investment.totalDays) {
                        const userRef = firebase.firestore().collection('users').doc(investment.userId);
                        userRef.update({
                            balance: firebase.firestore.FieldValue.increment(investment.dailyIncome),
                            totalEarned: firebase.firestore.FieldValue.increment(investment.dailyIncome)
                        });
                    }
                });
            }
        });
    });
}

// Run payout check every hour
setInterval(processDailyPayouts, 60 * 60 * 1000);

// Initial check
processDailyPayouts();
