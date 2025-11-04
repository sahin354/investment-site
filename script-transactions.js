document.addEventListener('DOMContentLoaded', function() {
    let currentUser;
    let lastVisible; // Used for pagination
    let isLoading = false;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const listContainer = document.getElementById('transactionList');

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) {
            window.location.href = 'login.html';
        } else {
            currentUser = user;
            loadTransactionHistory(true); // Initial load
        }
    });

    loadMoreBtn.addEventListener('click', () => {
        if (!isLoading) {
            loadTransactionHistory(false); // Load next page
        }
    });

    function loadTransactionHistory(isInitialLoad) {
        if (isLoading) return;
        isLoading = true;
        
        const db = firebase.firestore();
        let txQuery = db.collection('transactions')
                        .where('userId', '==', currentUser.uid)
                        .orderBy('timestamp', 'desc')
                        .limit(15); // Load 15 items at a time

        if (!isInitialLoad && lastVisible) {
            txQuery = txQuery.startAfter(lastVisible);
            loadMoreBtn.textContent = 'Loading...';
        } else {
            listContainer.innerHTML = '<p>Loading transactions...</p>';
        }

        txQuery.get().then((snapshot) => {
            if (isInitialLoad && snapshot.empty) {
                listContainer.innerHTML = '<p>No transactions found.</p>';
                loadMoreBtn.style.display = 'none';
                return;
            }

            if (isInitialLoad) {
                listContainer.innerHTML = ''; // Clear "Loading..."
            }

            // Save the last doc for the next query
            lastVisible = snapshot.docs[snapshot.docs.length - 1];

            snapshot.forEach(doc => {
                const tx = doc.data();
                const amount = tx.amount;
                const date = tx.timestamp ? tx.timestamp.toDate().toLocaleString() : 'Just now';
                
                // --- This is the HTML for a transaction item ---
                // It uses the styles you already have in style.css
                const txHTML = `
                    <div class="transaction-item">
                        <div class="transaction-details">
                            <span class="transaction-type">${tx.type}</span>
                            <span class="transaction-info">${tx.details}</span>
                        </div>
                        <div class="transaction-amount ${amount > 0 ? 'positive' : 'negative'}">
                            ${amount > 0 ? '+' : ''}₹${amount.toFixed(2)}
                            <span class="transaction-date">${date}</span>
                        </div>
                    </div>
                `;
                listContainer.innerHTML += txHTML;
            });

            // Show or hide the "Load More" button
            if (snapshot.docs.length < 15) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
                loadMoreBtn.textContent = 'Load More';
            }

            isLoading = false;
        }).catch((error) => {
            console.error("Error loading transactions:", error);
            listContainer.innerHTML = '<p style="color:red;">Error loading history. (Did you create the Firestore index?)</p>';
            isLoading = false;
        });
    }
});
