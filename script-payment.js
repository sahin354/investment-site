// script-payment.js

// Import necessary Firebase modules from your firebaseConfig.js
import { db, auth, functions, httpsCallable } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference for requesting withdrawals
const requestWithdrawalCallable = httpsCallable(functions, 'requestWithdrawal');

// Listen for auth state changes to get current user info and update UI
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserId = user.uid;
        // Fetch user balance to display on the withdrawal page
        const userDocRef = doc(db, 'users', currentUserId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            currentUserBalance = userDocSnap.data().balance || 0;
            updateBalanceDisplay(currentUserBalance); // Update UI
        } else {
            console.warn("User document not found for logged-in user:", currentUserId);
            updateBalanceDisplay(0);
        }
    } else {
        currentUserId = null;
        currentUserBalance = 0;
        updateBalanceDisplay(0);
        // Optionally, redirect to login or show a login prompt
        console.log("No user logged in on payment page.");
    }
});

// Function to update the balance display on the UI for the withdrawal page
function updateBalanceDisplay(balance) {
    const balanceElement = document.getElementById('userBalanceDisplayWithdraw'); // Adjust this ID if your element is different
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
    const currentBalanceText = document.getElementById('currentBalanceText'); // If you have text like "Your current balance is..."
    if (currentBalanceText) {
        currentBalanceText.textContent = `Your current balance is: ₹${balance.toFixed(2)}`;
    }
}


// --- WITHDRAWAL LOGIC (Calls Cloud Function) ---
document.addEventListener('DOMContentLoaded', () => {
    const withdrawalForm = document.getElementById('withdrawalForm'); // Adjust this ID if your form is different
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            if (!currentUserId) {
                alert("Please log in to request a withdrawal.");
                return;
            }

            // Get values from your withdrawal form inputs (adjust IDs to match your HTML)
            const amountInput = document.getElementById('withdrawalAmount');
            const methodInput = document.getElementById('withdrawalMethod'); // e.g., 'UPI', 'Bank Transfer'
            const accountNumberInput = document.getElementById('accountNumber');
            const ifscCodeInput = document.getElementById('ifscCode'); // This element might be optional in your HTML
            const bankNameInput = document.getElementById('bankName');
            const accountHolderNameInput = document.getElementById('accountHolderName');

            const amount = parseFloat(amountInput.value);
            const method = methodInput.value;
            const accountNumber = accountNumberInput.value;
            const ifscCode = ifscCodeInput ? ifscCodeInput.value : null; // Check if IFSC element exists, otherwise null
            const bankName = bankNameInput.value;
            const accountHolderName = accountHolderNameInput.value;

            // Basic client-side validation (Cloud Function will re-validate)
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
            // Add more specific validation for IFSC if applicable

            // Optional: Disable form elements and show a loading indicator
            const submitButton = withdrawalForm.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.disabled = true;
                const originalButtonText = submitButton.textContent;
                submitButton.textContent = 'Requesting...';
            }
            // You might have a specific loading spinner/message element
            // document.getElementById('withdrawalLoadingMessage').style.display = 'block';


            try {
                // Call the requestWithdrawal Cloud Function
                const result = await requestWithdrawalCallable({
                    amount: amount,
                    withdrawalMethod: method,
                    accountNumber: accountNumber,
                    ifscCode: ifscCode,
                    bankName: bankName,
                    accountHolderName: accountHolderName
                });

                alert(result.data.message);
                
                // On successful request, clear the form and refresh user balance
                if (result.data.status === 'success') {
                    withdrawalForm.reset(); // Clear all form inputs
                    // Re-fetch user balance to ensure it's up-to-date
                    const userDocRef = doc(db, 'users', currentUserId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                    // You might also want to redirect to a "Withdrawal History" page or refresh a list
                }

            } catch (error) {
                console.error("Error calling requestWithdrawal:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during withdrawal request.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in to request a withdrawal.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; // This will show messages like "Insufficient balance" or "Minimum withdrawal amount is..."
                } else if (error.code === 'invalid-argument') {
                    userFacingMessage = 'Please check your withdrawal details.';
                }
                alert(`Withdrawal failed: ${userFacingMessage}`);
            } finally {
                // Re-enable button and hide loading indicators
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = originalButtonText;
                }
                // document.getElementById('withdrawalLoadingMessage').style.display = 'none';
            }
        });
    } else {
        console.warn("Withdrawal form not found with ID 'withdrawalForm'.");
    }
});
