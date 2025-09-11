// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2"
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
