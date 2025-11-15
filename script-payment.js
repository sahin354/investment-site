// Import necessary Firebase modules from your firebaseConfig.js
import { db, auth, functions, httpsCallable } from './firebaseConfig.js';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore'; // For reading user data

let currentUserId = null;
let currentUserBalance = 0;

// Initialize callable function reference
const requestWithdrawalCallable = httpsCallable(functions, 'requestWithdrawal');

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
    const balanceElement = document.getElementById('userBalanceDisplayWithdraw'); // Assuming a specific element for withdrawal balance
    if (balanceElement) {
        balanceElement.textContent = `₹${balance.toFixed(2)}`;
    }
}


// --- NEW WITHDRAWAL LOGIC (Replaces direct Firestore writes) ---
document.addEventListener('DOMContentLoaded', () => {
    const withdrawalForm = document.getElementById('withdrawalForm'); // Assuming your withdrawal form has this ID
    if (withdrawalForm) {
        withdrawalForm.addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent default form submission

            if (!currentUserId) {
                alert("Please log in to request a withdrawal.");
                return;
            }

            // Get values from your withdrawal form inputs
            const amountInput = document.getElementById('withdrawalAmount');
            const methodInput = document.getElementById('withdrawalMethod'); // e.g., 'UPI', 'Bank Transfer'
            const accountNumberInput = document.getElementById('accountNumber');
            const ifscCodeInput = document.getElementById('ifscCode');
            const bankNameInput = document.getElementById('bankName');
            const accountHolderNameInput = document.getElementById('accountHolderName');

            const amount = parseFloat(amountInput.value);
            const method = methodInput.value;
            const accountNumber = accountNumberInput.value;
            const ifscCode = ifscCodeInput ? ifscCodeInput.value : null; // IFSC might be optional
            const bankName = bankNameInput.value;
            const accountHolderName = accountHolderNameInput.value;

            // Basic client-side validation (Cloud Function will re-validate)
            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid withdrawal amount.');
                return;
            }
            if (!accountNumber || !bankName || !accountHolderName) {
                alert('Please fill in all required bank details.');
                return;
            }

            // Optional: Disable form elements and show loading spinner
            withdrawalForm.querySelector('button[type="submit"]').disabled = true;
            // Add a loading message somewhere in your UI

            try {
                // Call the Cloud Function
                const result = await requestWithdrawalCallable({
                    amount: amount,
                    withdrawalMethod: method,
                    accountNumber: accountNumber,
                    ifscCode: ifscCode,
                    bankName: bankName,
                    accountHolderName: accountHolderName
                });

                alert(result.data.message);
                
                // On success: Clear form, refresh user balance, show withdrawal history
                if (result.data.status === 'success') {
                    withdrawalForm.reset(); // Clear the form
                    // Update current user balance locally (or re-fetch from Firestore)
                    const userDocRef = doc(db, 'users', currentUserId);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        currentUserBalance = userDocSnap.data().balance || 0;
                        updateBalanceDisplay(currentUserBalance);
                    }
                    // You might also want to refresh the list of user withdrawal requests
                }

            } catch (error) {
                console.error("Error calling requestWithdrawal:", error.code, error.message, error.details);
                let userFacingMessage = 'An unexpected error occurred during withdrawal.';
                if (error.code === 'unauthenticated') {
                    userFacingMessage = 'You must be logged in.';
                } else if (error.code === 'failed-precondition') {
                    userFacingMessage = error.message; // e.g., "Insufficient balance"
                } else if (error.code === 'invalid-argument') {
                    userFacingMessage = 'Please provide valid withdrawal details.';
                }
                alert(`Withdrawal failed: ${userFacingMessage}`);
            } finally {
                // Re-enable form elements
                withdrawalForm.querySelector('button[type="submit"]').disabled = false;
                // Hide loading message
            }
        });
    }
});

