// --- Rewritten Payouts Script ---

// Only run when Firebase is ready
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is logged in, process their payouts
            processDailyPayouts(user.uid);
        }
    });
}

/**
 * Processes all pending daily payouts for a user.
 * This function "catches up" if a user hasn't logged in for several days.
 * @param {string} userId The current user's UID
 */
async function processDailyPayouts(userId) {
    console.log('Processing payouts for user:', userId);
    const db = firebase.firestore();
    const now = new Date();

    const investmentsRef = db.collection('userInvestments');
    const query = investmentsRef
                    .where('userId', '==', userId)
                    .where('isActive', '==', true)
                    .where('nextPayout', '<=', now); // Get all investments ready for payout

    try {
        const snapshot = await query.get();
        if (snapshot.empty) {
            console.log('No payouts due.');
            return;
        }

        const batch = db.batch();
        const userRef = db.collection('users').doc(userId);
        let totalIncomeToUser = 0;

        snapshot.forEach(doc => {
            const investment = doc.data();
            const investmentRef = doc.ref;
            
            let lastPayout = investment.nextPayout.toDate();
            let completedDays = investment.completedDays;
            let totalEarned = investment.totalEarned;
            let isActive = investment.isActive;
            let payoutsToProcess = 0;

            // Loop to "catch up" all missed payments
            while (now >= lastPayout && isActive) {
                payoutsToProcess++;
                completedDays++;
                totalEarned += investment.dailyIncome;
                isActive = completedDays < investment.totalDays;
                lastPayout = new Date(lastPayout.getTime() + 24 * 60 * 60 * 1000); // 24 hours later
            }

            if (payoutsToProcess > 0) {
                const totalIncomeForThisPlan = payoutsToProcess * investment.dailyIncome;
                totalIncomeToUser += totalIncomeForThisPlan;

                // 1. Update the investment document
                batch.update(investmentRef, {
                    completedDays: completedDays,
                    totalEarned: totalEarned,
                    isActive: isActive,
                    nextPayout: lastPayout
                });

                // 2. Log this payout as a transaction
                const txRef = db.collection('transactions').doc();
                batch.set(txRef, {
                    userId: userId,
                    type: 'Earnings',
                    amount: totalIncomeForThisPlan,
                    details: `Daily income from ${investment.planName} (x${payoutsToProcess} days)`,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        });

        if (totalIncomeToUser > 0) {
            // 3. Update the user's main balance once with all earnings
            batch.update(userRef, {
                balance: firebase.firestore.FieldValue.increment(totalIncomeToUser)
            });

            // 4. Commit all changes at once
            await batch.commit();
            console.log(`Successfully processed ${snapshot.size} payouts. Total added: ₹${totalIncomeToUser}`);
        }

    } catch (error) {
        console.error('Error processing payouts: ', error);
    }
}
