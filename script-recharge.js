// Import necessary Firebase modules from your firebaseConfig.js
import { db, auth, functions, httpsCallable } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // For reading user/plan data

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference
const buyInvestmentPlanCallable = httpsCallable(functions, 'buyInvestmentPlan');

// Listen for auth state changes to get current user info
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        // Fetch user balance
        const userDocRef = doc(db, 'users', currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserBalance = userDocSnap.data().balance || 0;
            updateBalanceDisplay(currentUserBalance); // Call a function to update UI
        }
    } else {
        currentUserId = null;
        currentUserBalance = 0;
        updateBalanceDisplay(0);
        // Redirect to login or show login prompt
    }
});

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('userBalanceDisplay'); // Assuming you have an element to show balance
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
}

// --- Logic for displaying Investment Plans (assuming it's already here) ---
// You'll need to adapt this part based on how your plans are currently loaded and displayed.
// This is a placeholder for your existing plan display logic.
async function loadInvestmentPlans() {
    const plansContainer = document.getElementById('investmentPlansContainer'); // Assuming a container element
    if (!plansContainer) return;

    // Fetch plans from Firestore (this read is allowed by your rules)
    const querySnapshot = await db.collection('investmentPlans').get();
    plansContainer.innerHTML = ''; // Clear existing plans

    querySnapshot.forEach((doc) => {
        const plan = doc.data();
        const planId = doc.id; // Get the document ID for the plan

        const planCard = document.createElement('div');
        planCard.className = 'plan-card'; // Add your specific styling class

        planCard.innerHTML = `
            <h3>${plan.name}</h3>
            <p>Price: ₹${plan.price}</p>
            <p>Daily Income: ₹${plan.dailyIncome}</p>
            <p>Cycle: ${plan.totalDays} Days</p>
            <p>Total Income: ₹${plan.totalIncome}</p>
            <button class="buy-now-button" data-plan-id="${planId}">Buy Now</button>
        `;
        plansContainer.appendChild(planCard);
    });

    // Attach event listeners to the new "Buy Now" buttons
    attachBuyNowListeners();
}


// --- NEW BUY NOW LOGIC (Replaces direct Firestore writes) ---
function attachBuyNowListeners() {
    const buyButtons = document.querySelectorAll('.buy-now-button');
    buyButtons.forEach(button => {
        button.onclick = null; // Remove old listeners to prevent duplicates
        button.addEventListener('click', async (event) => {
            if (!currentUserId) {
                alert("Please log in to purchase an investment plan.");
                return;
            }

            const planId = event.target.dataset.planId; // Get plan ID from the button's data attribute
            if (!planId) {
                alert("Could not find plan ID.");
                return;
            }

            // Optional: Disable button and show loading spinner
            event.target.disabled = true;
            event.target.textContent = 'Purchasing...';

            try {
                // Call the Cloud Function
                const result = await buyInvestmentPlanCallable({ planId: planId });
                alert(result.data.message);
                
                // On success, refresh user balance and possibly investment list
                if (result.data.status === 'success') {
                    // Update current user balance locally (or re-fetch from Firestore)
                    const userDocRef = doc(db, 'users', currentUserId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                    // You might also want to refresh the list of user investments here
                }

            } catch (error) {
                console.error("Error calling buyInvestmentPlan:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during purchase.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; // "Insufficient balance"
                } else if (error.code === 'not-found') {
                    userFacingMessage = 'Investment plan or user profile not found.';
                }
                alert(`Purchase failed: ${userFacingMessage}`);
            } finally {
                // Re-enable button
                event.target.disabled = false;
                event.target.textContent = 'Buy Now';
            }
        });
    });
}


// --- Recharge logic (assuming it's already here and doesn't need Cloud Functions) ---
// (Your existing recharge logic would go here if it's separate and only creates payment_requests)
// Example placeholder:
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
            requestDate: new Date()
        });
        alert("Recharge request submitted. Awaiting admin approval.");
        document.getElementById('rechargeForm').reset();
    } catch (error) {
        console.error("Error submitting recharge request:", error);
        alert("Failed to submit recharge request.");
    }
});
*/

// Load plans when the DOM is ready
document.addEventListener('DOMContentLoaded', loadInvestmentPlans);

