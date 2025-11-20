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

 // -----------------------------
// PAY0 AUTO RECHARGE INTEGRATION
// -----------------------------
document.addEventListener('DOMContentLoaded', () => {
    const amountInput = document.getElementById('rechargeAmount');
    const form = document.getElementById('rechargeForm');
    const quickButtons = document.querySelectorAll('.quick-amount-btn');
    const MIN_AMOUNT = 120;
    const MAX_AMOUNT = 50000;

    // Quick amount buttons just set the input value
    if (amountInput && quickButtons && quickButtons.length) {
        quickButtons.forEach((btn) => {
            btn.addEventListener('click', () => {
                const value = btn.getAttribute('data-amount');
                if (value) {
                    amountInput.value = value;
                }
            });
        });
    }

    // If Pay0 redirected back with ?pay0Return=1 then verify payment
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('pay0Return') === '1') {
        handlePay0Return();
    }

    if (form && amountInput) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const user = firebase.auth().currentUser;
            if (!user) {
                alert('Please login first.');
                return;
            }

            const amount = parseFloat(amountInput.value);
            if (isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
                alert('Please enter an amount between ₹' + MIN_AMOUNT + ' and ₹' + MAX_AMOUNT + '.');
                return;
            }

            const orderId = 'RECHARGE-' + Date.now();

            const redirectUrl = window.location.origin + window.location.pathname + '?pay0Return=1';

            const payload = {
                customer_mobile: user.phoneNumber ? user.phoneNumber.replace('+', '') : '9999999999',
                customer_name: user.displayName || user.email || 'User',
                amount: amount,
                order_id: orderId,
                redirect_url: redirectUrl,
                remark1: 'wallet-recharge',
                remark2: user.uid
            };

            const submitBtn = document.getElementById('proceedRecharge');
            let originalText;
            if (submitBtn) {
                submitBtn.disabled = true;
                originalText = submitBtn.textContent;
                submitBtn.textContent = 'Redirecting to Payment...';
            }

            try {
                const res = await fetch('/api/pay0-create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                const data = await res.json();
                console.log('Pay0 create-order:', data);

                if (data.status && data.result && data.result.payment_url) {
                    // Save order info so we can verify later
                    localStorage.setItem('pay0_last_order_id', orderId);
                    localStorage.setItem('pay0_last_amount', String(amount));

                    window.location.href = data.result.payment_url;
                } else {
                    alert(data.message || 'Unable to start payment. Please try again.');
                }
            } catch (err) {
                console.error('Error creating Pay0 order:', err);
                alert('Something went wrong while connecting to payment gateway.');
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText || 'Proceed to Recharge';
                }
            }
        });
    }
});

async function handlePay0Return() {
    const orderId = localStorage.getItem('pay0_last_order_id');
    const amountString = localStorage.getItem('pay0_last_amount');
    const amount = parseFloat(amountString || '0');

    if (!orderId) {
        console.warn('No stored Pay0 order id.');
        return;
    }

    try {
        const res = await fetch('/api/pay0-check-order-status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_id: orderId })
        });

        const data = await res.json();
        console.log('Pay0 status:', data);

        const status = data && data.result && data.result.txnStatus;

        if (data.status && status === 'SUCCESS') {
            const user = firebase.auth().currentUser;
            if (!user) {
                alert('Payment successful, but user is not logged in. Please login again.');
                return;
            }

            const userRef = db.collection('users').doc(user.uid);
            const txRef = db.collection('transactions').doc(orderId || undefined);

            await db.runTransaction(async (tx) => {
                const userSnap = await tx.get(userRef);
                const oldBalance = userSnap.exists ? (userSnap.data().balance || 0) : 0;

                tx.set(
                    userRef,
                    {
                        balance: oldBalance + amount
                    },
                    { merge: true }
                );

                tx.set(
                    txRef,
                    {
                        userId: user.uid,
                        type: 'Credit',
                        amount: amount,
                        details: 'Wallet recharge via Pay0',
                        gateway: 'pay0',
                        status: 'Success',
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    },
                    { merge: true }
                );
            });

            alert('Payment successful! ₹' + amount.toFixed(2) + ' added to your wallet.');

            // Refresh on-page balance display if helper exists
            if (typeof updateBalanceDisplay === 'function') {
                const refreshedSnap = await db.collection('users').doc(user.uid).get();
                if (refreshedSnap.exists) {
                    const newBalance = refreshedSnap.data().balance || 0;
                    updateBalanceDisplay(newBalance);
                }
            }

            localStorage.removeItem('pay0_last_order_id');
            localStorage.removeItem('pay0_last_amount');
        } else if (status === 'FAILED' || status === 'CANCELLED') {
            alert('Payment failed or cancelled. If amount is debited from your bank, contact support.');
            localStorage.removeItem('pay0_last_order_id');
            localStorage.removeItem('pay0_last_amount');
        } else {
            console.log('Payment pending or unknown status:', status);
        }
    } catch (err) {
        console.error('Error checking Pay0 status:', err);
        alert('Could not verify payment status. If money was deducted, please contact support with screenshot.');
    }
}               
