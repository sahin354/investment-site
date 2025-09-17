document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.firestore();
    const auth = firebase.auth();

    const primaryContainer = document.getElementById('primary');
    const purchasedContainer = document.getElementById('purchased');
    const tabs = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    let currentUser = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadInvestmentPlans();
        } else {
            window.location.href = 'login.html';
        }
    });

    // Tab switching logic
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            contents.forEach(item => item.classList.remove('active'));

            tab.classList.add('active');
            const target = document.getElementById(tab.dataset.tab);
            target.classList.add('active');
            
            // If "Purchased" tab is clicked, load their purchased plans
            if(tab.dataset.tab === 'purchased') {
                loadPurchasedPlans();
            }
        });
    });

    // Function to load available investment plans
    const loadInvestmentPlans = () => {
        db.collection('plans').where('type', '==', 'primary').get().then(querySnapshot => {
            primaryContainer.innerHTML = '';
            querySnapshot.forEach(doc => {
                const plan = doc.data();
                const planId = doc.id;
                const planCard = `
                    <div class="plan-card">
                        <img src="${plan.imageUrl || 'logo.png'}" alt="${plan.name}">
                        <div class="plan-details">
                            <h4>${plan.name}</h4>
                            <p>Price: ₹${plan.price}</p>
                            <p>Daily Income: ₹${plan.dailyIncome}</p>
                        </div>
                        <button class="buy-btn" data-id="${planId}">Buy</button>
                    </div>
                `;
                primaryContainer.innerHTML += planCard;
            });
        });
    };

    // Function to load plans the user has already purchased
    const loadPurchasedPlans = () => {
        if (!currentUser) return;
        purchasedContainer.innerHTML = '<h3>Loading your plans...</h3>';
        
        db.collection('users').doc(currentUser.uid).collection('purchases').orderBy('purchaseDate', 'desc').get().then(snapshot => {
            if (snapshot.empty) {
                purchasedContainer.innerHTML = '<p>You have not purchased any plans yet.</p>';
                return;
            }
            purchasedContainer.innerHTML = '';
            snapshot.forEach(doc => {
                const purchase = doc.data();
                const planCard = `
                    <div class="plan-card purchased">
                        <img src="${purchase.imageUrl || 'logo.png'}" alt="${purchase.planName}">
                        <div class="plan-details">
                            <h4>${purchase.planName}</h4>
                            <p>Purchased on: ${new Date(purchase.purchaseDate.toDate()).toLocaleDateString()}</p>
                            <p>Daily Income: ₹${purchase.dailyIncome}</p>
                        </div>
                        <div class="status-tag">Active</div>
                    </div>
                `;
                purchasedContainer.innerHTML += planCard;
            });
        });
    };

    // --- PURCHASE LOGIC ---
    // Use event delegation to listen for clicks on dynamically added buttons
    document.body.addEventListener('click', async (e) => {
        if (e.target && e.target.classList.contains('buy-btn')) {
            const planId = e.target.dataset.id;
            if (confirm("Are you sure you want to purchase this plan?")) {
                await handlePurchase(planId);
            }
        }
    });

    async function handlePurchase(planId) {
        if (!currentUser) return alert("You must be logged in to purchase.");

        const userRef = db.collection('users').doc(currentUser.uid);
        const planRef = db.collection('plans').doc(planId);

        try {
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                const planDoc = await transaction.get(planRef);

                if (!userDoc.exists) throw new Error("User does not exist.");
                if (!planDoc.exists) throw new Error("Plan does not exist.");

                const userData = userDoc.data();
                const planData = planDoc.data();

                // 1. Check if user has enough balance
                if (userData.balance < planData.price) {
                    throw new Error("Insufficient balance.");
                }

                // 2. Calculate new balance and update user document
                const newBalance = userData.balance - planData.price;
                transaction.update(userRef, {
                    balance: newBalance,
                    vipLevel: planData.vipLevel // Update VIP level based on the plan
                });

                // 3. Record the purchase in a subcollection
                const purchaseRef = userRef.collection('purchases').doc();
                transaction.set(purchaseRef, {
                    planId: planId,
                    planName: planData.name,
                    price: planData.price,
                    dailyIncome: planData.dailyIncome,
                    imageUrl: planData.imageUrl || null,
                    purchaseDate: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            alert("Purchase successful!");
            // You can also update the balance displayed on the page here
            
        } catch (error) {
            console.error("Purchase failed: ", error);
            alert(`Purchase failed: ${error.message}`);
        }
    }
});
              
