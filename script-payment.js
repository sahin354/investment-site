// script-payment.js - FOR CDN-BASED (NON-MODULE) SETUP

// Access Firebase services globally:
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Initialize Cloud Functions for callable

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference
const requestWithdrawalCallable = functions.httpsCallable('requestWithdrawal');

// Listen for auth state changes to get current user info and update UI
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUserId = user.uid;
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
        console.log("No user logged in on payment page.");
    }
});

function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('userBalanceDisplayWithdraw'); 
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
    const currentBalanceText = document.getElementById('currentBalanceText'); 
    if (currentBalanceText) {
        currentBalanceText.textContent = `Your current balance is: ₹${balance.toFixed(2)}`;
    }
}


// --- WITHDRAWAL LOGIC (Calls Cloud Function) ---
document.addEventListener('DOMContentLoaded', () => {
    const withdrawalForm = document.getElementById('withdrawalForm'); 
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 

            if (!currentUserId) {
                alert("Please log in to request a withdrawal.");
                return;
            }

            const amountInput = document.getElementById('withdrawalAmount');
            const methodInput = document.getElementById('withdrawalMethod'); 
            const accountNumberInput = document.getElementById('accountNumber');
            const ifscCodeInput = document.getElementById('ifscCode'); 
            const bankNameInput = document.getElementById('bankName');
            const accountHolderNameInput = document = document.getElementById('accountHolderName');

            const amount = parseFloat(amountInput.value);
            const method = methodInput.value;
            const accountNumber = accountNumberInput.value;
            const ifscCode = ifscCodeInput ? ifscCodeInput.value : null; 
            const bankName = bankNameInput.value;
            const accountHolderName = accountHolderNameInput.value;

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid withdrawal amount.');
                return;
            }
            if (!method) {
                alert('Please select a withdrawal method.');
                return;
            }
            if (!accountNumber || !bankName || !accountHolderName) {
                alert('Please fill in all required bank details.');
                return;
            }

            const submitButton = withdrawalForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Requesting...';
            }

            try {
                const result = await requestWithdrawalCallable({
                    amount: amount,
                    withdrawalMethod: method,
                    accountNumber: accountNumber,
                    ifscCode: ifscCode,
                    bankName: bankName,
                    accountHolderName: accountHolderName
                });

                alert(result.data.message);
                
                if (result.data.status === 'success') {
                    withdrawalForm.reset(); 
                    const userDocRef = db.collection('users').doc(currentUserId);
                    const userDocSnap = await userDocRef.get();
                    if (userDocSnap.exists) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                }

            } catch (error) {
                console.error("Error calling requestWithdrawal:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during withdrawal request.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in to request a withdrawal.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; 
                } else if (error.code === 'invalid-argument') {
                    userFacingMessage = 'Please check your withdrawal details.';
                }
                alert(`Withdrawal failed: ${userFacingMessage}`);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
            }
        });
    } else {
        console.warn("Withdrawal form not found with ID 'withdrawalForm'.");
    }
});
                    
