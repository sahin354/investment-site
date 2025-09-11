// IMPORTANT: You need to get this from your own Firebase project
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const statusEl = document.getElementById('status');

// Function to save the plan data to Firestore
function savePlan(planName) {
    const price = document.getElementById(`${planName}-price`).value;
    const income = document.getElementById(`${planName}-income`).value;

    if (!price || !income) {
        statusEl.textContent = 'Please fill out all fields.';
        return;
    }

    // 'plans' is the collection name, planName is the document ID
    db.collection('plans').doc(planName).set({
        price: Number(price),
        dailyIncome: Number(income)
    })
    .then(() => {
        statusEl.textContent = `${planName} plan updated successfully!`;
        console.log("Document successfully written!");
    })
    .catch((error) => {
        statusEl.textContent = `Error writing document: ${error}`;
        console.error("Error writing document: ", error);
    });
}
