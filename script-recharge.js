// script-recharge.js - FOR CDN-BASED (NON-MODULE) SETUP

// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Initialize Cloud Functions for callable

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference
const buyInvestmentPlanCallable = functions.httpsCallable('buyInvestmentPlan');


// Listen for auth state changes to get current user info and update UI
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUserId = user.uid;
        // Fetch user balance
        const userDocRef = db.collection('users').doc(currentUserId);
        const userDocSnap = await userDocRef.get();
        if (userDocSnap.exists) {
            currentUserBalance = userDocSnap.data().balance || 0;
            updateBalanceDisplay(currentUserBalance); 
        } else {
            console.warn("User document not found for logged-in user:", currentUserId);
            updateBalanceDisplay(0); 
        }
    } else {
        currentUserId = null;
        currentUserBalance = 0;
        updateBalanceDisplay(0);
        console.log("No user logged in on recharge page.");
    }
});

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('userBalanceDisplay'); 
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
}

// --- Logic for displaying Investment Plans ---
async function loadInvestmentPlans() {
    const plansContainer = document.getElementById('investmentPlansContainer'); 
    if (!plansContainer) {
        console.error("Investment plans container not found (ID: investmentPlansContainer).");
        return;
    }

    try {
        const querySnapshot = await db.collection('investmentPlans').get();
        plansContainer.innerHTML = ''; 

        if (querySnapshot.empty) {
            plansContainer.innerHTML = '<p>No investment plans available at the moment.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const plan = doc.data();
            const planId = doc.id; 

            const planCard = document.createElement('div');
            planCard.className = 'plan-card'; 
            planCard.innerHTML = `
                <div class="plan-header">${plan.name}</div>
                <div class="plan-details">
                    <p>Price: <span>₹${plan.price}</span></p>
                    <p>Daily Income: <span>₹${plan.dailyIncome}</span></p>
                    <p>Cycle: <span>${plan.totalDays} Days</span></p>
                    <p>Total Income: <span>₹${plan.totalIncome}</span></p>
                </div>
                <button class="buy-now-button" data-plan-id="${planId}">Buy Now</button>
            `;
            plansContainer.appendChild(planCard);
        });

        attachBuyNowListeners();

    } catch (error) {
        console.error("Error loading investment plans:", error);
        plansContainer.innerHTML = '<p>Failed to load investment plans. Please try again later.</p>';
    }
}


// --- BUY NOW LOGIC (Calls Cloud Function) ---
function attachBuyNowListeners() {
    const buyButtons = document.querySelectorAll('.buy-now-button'); 
    buyButtons.forEach(button => {
        button.onclick = null; 
        button.addEventListener('click', async (event) => {
            if (!currentUserId) {
                alert("Please log in to purchase an investment plan.");
                return;
            }

            const planId = event.target.dataset.planId; 
            if (!planId) {
                alert("Could not find plan ID for purchase.");
                return;
            }

            event.target.disabled = true;
            const originalButtonText = event.target.textContent;
            event.target.textContent = 'Purchasing...';

            try {
                const result = await buyInvestmentPlanCallable({ planId: planId });
                alert(result.data.message);
                
                if (result.data.status === 'success') {
                    const userDocRef = db.collection('users').doc(currentUserId);
                    const userDocSnap = await userDocRef.get();
                    if (userDocSnap.exists) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                }

            } catch (error) {
                console.error("Error calling buyInvestmentPlan:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during purchase.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in to purchase a plan.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; 
                } else if (error.code === 'not-found') {
                    userFacingMessage = 'Investment plan or your user profile not found.';
                } else if (error.code === 'invalid-argument') {
                    userFacingMessage = 'Invalid plan data provided.';
                }
                alert(`Purchase failed: ${userFacingMessage}`);
            } finally {
                event.target.disabled = false;
                event.target.textContent = originalButtonText;
            }
        });
    });
}


// --- Recharge logic (if present and uses global firebase.firestore()) ---
/*
document.getElementById('rechargeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentUserId) {
        alert("Please log in to recharge.");
        return;
    }
    const amount = parseFloat(document.getElementById('rechargeAmount').value);
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount.");
        return;
    }
    try {
        await db.collection('payment_requests').add({
            userId: currentUserId,
            amount: amount,
            status: 'pending',
            requestDate: firebase.firestore.FieldValue.serverTimestamp()
        });
        alert("Recharge request submitted. Awaiting admin approval.");
        document.getElementById('rechargeForm').reset();
    } catch (error) {
        console.error("Error submitting recharge request:", error);
        alert("Failed to submit recharge request.");
    }
});
*/

document.addEventListener('DOMContentLoaded', loadInvestmentPlans);

                
