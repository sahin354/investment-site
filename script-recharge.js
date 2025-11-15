// script-recharge.js

// Import necessary Firebase modules from your firebaseConfig.js
import { db, auth, functions, httpsCallable } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'; // Added collection and getDocs for plan loading

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference for buying investment plans
const buyInvestmentPlanCallable = httpsCallable(functions, 'buyInvestmentPlan');

// Listen for auth state changes to get current user info and update UI
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        // Fetch user balance
        const userDocRef = doc(db, 'users', currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserBalance = userDocSnap.data().balance || 0;
            updateBalanceDisplay(currentUserBalance); // Update UI with current balance
        } else {
            console.warn("User document not found for logged-in user:", currentUserId);
            updateBalanceDisplay(0); // Show 0 if doc doesn't exist
        }
    } else {
        currentUserId = null;
        currentUserBalance = 0;
        updateBalanceDisplay(0);
        // Optionally, redirect to login or show a login prompt if not authenticated
        console.log("No user logged in on recharge page.");
    }
});

// Function to update the balance display on the UI
function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('userBalanceDisplay'); // Assuming an element with this ID
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
}

// --- Logic for displaying Investment Plans ---
async function loadInvestmentPlans() {
    const plansContainer = document.getElementById('investmentPlansContainer'); // Adjust this ID if your container is different
    if (!plansContainer) {
        console.error("Investment plans container not found (ID: investmentPlansContainer).");
        return;
    }

    try {
        // Fetch plans from Firestore (this read is allowed by your rules for logged-in users)
        const querySnapshot = await getDocs(collection(db, 'investmentPlans'));
        plansContainer.innerHTML = ''; // Clear existing plans

        if (querySnapshot.empty) {
            plansContainer.innerHTML = '<p>No investment plans available at the moment.</p>';
            return;
        }

        querySnapshot.forEach((documentSnapshot) => {
            const plan = documentSnapshot.data();
            const planId = documentSnapshot.id; // Get the document ID for the plan

            const planCard = document.createElement('div');
            planCard.className = 'plan-card'; // Add your specific styling class for a plan card
            // You might want to match your existing HTML structure for a plan item
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

        // Attach event listeners to the new "Buy Now" buttons AFTER they are added to the DOM
        attachBuyNowListeners();

    } catch (error) {
        console.error("Error loading investment plans:", error);
        plansContainer.innerHTML = '<p>Failed to load investment plans. Please try again later.</p>';
    }
}


// --- BUY NOW LOGIC (Calls Cloud Function) ---
function attachBuyNowListeners() {
    const buyButtons = document.querySelectorAll('.buy-now-button'); // Select all buttons with this class
    buyButtons.forEach(button => {
        // Remove old listeners to prevent multiple triggers if loadInvestmentPlans is called again
        button.onclick = null; 
        button.addEventListener('click', async (event) => {
            if (!currentUserId) {
                alert("Please log in to purchase an investment plan.");
                return;
            }

            const planId = event.target.dataset.planId; // Get plan ID from the button's data-plan-id attribute
            if (!planId) {
                alert("Could not find plan ID for purchase.");
                return;
            }

            // Optional: Disable button and show loading indicator
            event.target.disabled = true;
            const originalButtonText = event.target.textContent;
            event.target.textContent = 'Purchasing...';

            try {
                // Call the buyInvestmentPlan Cloud Function
                const result = await buyInvestmentPlanCallable({ planId: planId });
                alert(result.data.message);
                
                // On successful purchase, refresh UI elements
                if (result.data.status === 'success') {
                    // Re-fetch user balance to ensure it's up-to-date
                    const userDocRef = doc(db, 'users', currentUserId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                    // You might also want to refresh a list of user's active investments here
                    // window.location.reload(); // Simple but effective if you want a full refresh
                }

            } catch (error) {
                console.error("Error calling buyInvestmentPlan:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during purchase.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in to purchase a plan.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; // This will show "Insufficient balance" or other specific messages
                } else if (error.code === 'not-found') {
                    userFacingMessage = 'Investment plan or your user profile not found.';
                } else if (error.code === 'invalid-argument') {
                    userFacingMessage = 'Invalid plan data provided.';
                }
                alert(`Purchase failed: ${userFacingMessage}`);
            } finally {
                // Re-enable button and restore text
                event.target.disabled = false;
                event.target.textContent = originalButtonText;
            }
        });
    });
}


// --- Recharge logic (assuming it's already here and only creates payment_requests) ---
// This part is assumed to be correct and create a 'payment_requests' document,
// which is allowed by your Firestore rules. No Cloud Function needed for just creating the request.
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
        // This is a direct Firestore write, which is allowed by your rules for payment_requests
        await addDoc(collection(db, 'payment_requests'), {
            userId: currentUserId,
            amount: amount,
            status: 'pending',
            requestDate: serverTimestamp() // Use serverTimestamp if imported
        });
        alert("Recharge request submitted. Awaiting admin approval.");
        document.getElementById('rechargeForm').reset();
    } catch (error) {
        console.error("Error submitting recharge request:", error);
        alert("Failed to submit recharge request.");
    }
});
*/


// Load investment plans when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', loadInvestmentPlans);

                    
