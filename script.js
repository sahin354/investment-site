// This script handles the home page: loading plans, purchasing, and tabs.
document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();
    const primaryContainer = document.getElementById('primary');
    const purchasedContainer = document.getElementById('purchased');
    let currentUser = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadInvestmentPlans();
        } else {
            window.location.href = 'login.html';
        }
    });

    // ... (Full tab switching, loadInvestmentPlans, loadPurchasedPlans, and handlePurchase logic) ...
});
