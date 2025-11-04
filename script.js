document.addEventListener('DOMContentLoaded', () => {
    // Check if a user is logged in.
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is logged in:', user.uid);
            initializeApp(user);
        } else {
            console.log('No user logged in, redirecting...');
            // window.location.href = 'login.html'; // Already handled by common.js
        }
    });
});

function initializeApp(user) {
    setupTabs();
    loadInvestmentPlans();
    
    // --- Load purchased plans for the user ---
    loadPurchasedPlans(user.uid);
    
    // --- Add click listener for 'Buy Now' buttons ---
    const mainElement = document.querySelector('main');
    mainElement.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('buy-button')) {
            const planCard = e.target.closest('.plan-card');
            const planId = planCard.dataset.planId;
            if (planId) {
                buyPlan(planId, user.uid);
            }
        }
    });
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

async function buyPlan(planId, userId) {
    if (!confirm('Are you sure you want to buy this plan?')) {
        return;
    }

    const db = firebase.firestore();
    const planRef = db.collection('investmentPlans').doc(planId);
    const userRef = db.collection('users').doc(userId);

    try {
        await db.runTransaction(async (transaction) => {
            const planDoc = await transaction.get(planRef);
            const userDoc = await transaction.get(userRef);

            if (!planDoc.exists) throw new Error("Plan not found.");
            if (!userDoc.exists) throw new Error("User not found.");

            const plan = planDoc.data();
            const user = userDoc.data();
            const cost = plan.minAmount;

            if (user.balance < cost) {
                throw new Error("Insufficient balance.");
            }

            transaction.update(userRef, {
                balance: firebase.firestore.FieldValue.increment(-cost)
            });

            const investmentRef = db.collection('userInvestments').doc();
            const dailyIncome = (plan.minAmount * plan.dailyReturnPercent) / 100;
            const now = new Date();

            transaction.set(investmentRef, {
                userId: userId,
                planId: planId,
                planName: plan.name,
                startDate: firebase.firestore.FieldValue.serverTimestamp(),
                nextPayout: new Date(now.getTime() + 24 * 60 * 60 * 1000), 
                totalDays: plan.durationDays,
                completedDays: 0,
                dailyIncome: dailyIncome,
                totalEarned: 0,
                isActive: true
            });

            const txRef = db.collection('transactions').doc();
            transaction.set(txRef, {
                userId: userId,
                type: 'Investment',
                amount: -cost,
                details: `Purchased plan: ${plan.name}`,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });

        alert('Purchase Successful! Your plan is now active.');

    } catch (error) {
        console.error("Purchase failed: ", error);
        alert(`Purchase failed: ${error.message}`);
    }
}


/**
 * --- UPDATED: loadPurchasedPlans Function ---
 * This now fetches with just 'where' and sorts the results in JavaScript.
 * This FIXES the "empty list" problem without needing a console.
 */
function loadPurchasedPlans(userId) {
    const purchasedContainer = document.getElementById('purchased');
    purchasedContainer.innerHTML = '<p>Loading purchased plans...</p>';
    
    const db = firebase.firestore();
    // --- THIS IS THE FIX ---
    // Removed .orderBy() to avoid needing an index
    const investmentsRef = db.collection('userInvestments')
                             .where('userId', '==', userId);

    investmentsRef.onSnapshot((querySnapshot) => {
        if (querySnapshot.empty) {
            purchasedContainer.innerHTML = "<p>You have not purchased any plans yet.</p>";
            return;
        }

        purchasedContainer.innerHTML = ''; // Clear container

        // --- NEW: Sort the results manually in JavaScript ---
        const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        docs.sort((a, b) => {
            const dateA = a.startDate ? a.startDate.seconds : 0;
            const dateB = b.startDate ? b.startDate.seconds : 0;
            return dateB - dateA; // Sort descending (newest first)
        });

        docs.forEach((investment) => {
            const daysRemaining = investment.totalDays - investment.completedDays;
            const status = investment.isActive ? 'Active' : 'Completed';
            const statusColor = investment.isActive ? 'green' : 'gray';

            const planCardHTML = `
                <div class="purchased-plan-card">
                    <div class="plan-card-header">
                        <h3>${investment.planName}</h3>
                        <span class="plan-status" style="color: ${statusColor};">● ${status}</span>
                    </div>
                    <div class="plan-card-body">
                        <div class="plan-detail">
                            <span class="plan-label">Daily Income</span>
                            <span class="plan-value">₹${investment.dailyIncome.toFixed(2)}</span>
                        </div>
                        <div class="plan-detail">
                            <span class="plan-label">Total Earned</span>
                            <span class="plan-value">₹${investment.totalEarned.toFixed(2)}</span>
                        </div>
                    </div>
                    <div class="plan-progress">
                        <div class="progress-label">
                            <span>Progress: ${investment.completedDays} / ${investment.totalDays} Days</span>
                            <span>(${daysRemaining} days left)</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar-fill" style="width: ${(investment.completedDays / investment.totalDays) * 100}%;"></div>
                        </div>
                    </div>
                </div>
            `;
            purchasedContainer.innerHTML += planCardHTML;
        });

    }, (error) => {
        console.error("Error loading purchased plans: ", error);
        purchasedContainer.innerHTML = "<p style='color:red;'>Could not load purchased plans.</p>";
    });
}


function loadInvestmentPlans() {
    // This function remains the same, but I'm including it
    // for completeness.
    
    const primaryContainer = document.getElementById('primary');
    const vipContainer = document.getElementById('vip');

    primaryContainer.innerHTML = '<p>Loading plans...</p>';
    vipContainer.innerHTML = '<p>Loading VIP plans...</p>';

    const db = firebase.firestore();

    db.collection("investmentPlans")
      .where("isActive", "==", true)
      .orderBy("minAmount", "asc")
      .onSnapshot((querySnapshot) => {
          primaryContainer.innerHTML = '';
          vipContainer.innerHTML = '';

          if (querySnapshot.empty) {
              primaryContainer.innerHTML = "<p>No investment plans are available at the moment.</p>";
              return;
          }
          
          let primaryPlansExist = false;
          let vipPlansExist = false;

          querySnapshot.forEach((doc) => {
              const plan = doc.data();
              const planId = doc.id;

              const planCardHTML = `
                  <div class="plan-card ${plan.isVIP ? 'vip' : ''}" data-plan-id="${planId}">
                      <div class="plan-card-header">
                          <h3>${plan.name}</h3>
                          ${plan.isVIP ? '<span class="vip-badge">VIP</span>' : ''}
                      </div>
                      <div class="plan-card-body">
                          <div class="plan-detail">
                              <span class="plan-label">Investment Price</span>
                              <span class="plan-value">₹${plan.minAmount.toLocaleString()}</span>
                          </div>
                          <div class="plan-detail">
                              <span class="plan-label">Daily Income</span>
                              <span class="plan-value">₹${((plan.minAmount * plan.dailyReturnPercent) / 100).toFixed(2)}</span>
                          </div>
                          <div class="plan-label">
                              <span class="plan-label">Cycle</span>
                              <span class="plan-value">${plan.durationDays} Days</span>
                          </div>
                          <div class="plan-detail">
                              <span class="plan-label">Total Income</span>
                              <span class="plan-value">₹${((plan.minAmount * plan.totalReturnPercent) / 100).toLocaleString()}</span>
                          </div>
                      </div>
                      <div class="plan-card-footer">
                          <button class="buy-button">Buy Now</button>
                      </div>
                  </div>
              `;

              if (plan.isVIP) {
                  vipContainer.innerHTML += planCardHTML;
                  vipPlansExist = true;
              } else {
                  primaryContainer.innerHTML += planCardHTML;
                  primaryPlansExist = true;
              }
          });

          if (!primaryPlansExist) {
              primaryContainer.innerHTML = "<p>No primary plans are available right now.</p>";
          }
          if (!vipPlansExist) {
              vipContainer.innerHTML = "<p>No VIP plans are available right now.</p>";
          }

      }, (error) => {
          console.error("Error getting investment plans: ", error);
          primaryContainer.innerHTML = "<p style='color:red;'>Could not load investment plans.</p>";
          vipContainer.innerHTML = "<p style='color:red;'>Could not load VIP plans.</p>";
      });
}
