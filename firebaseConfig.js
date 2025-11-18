// firebaseConfig.js
// REPLACE THESE WITH YOUR ACTUAL KEYS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2" 
};

// Initialize Firebase Global Variable
firebase.initializeApp(firebaseConfig);

// These become available globally as firebase.auth(), firebase.firestore()
console.log("Firebase Config Loaded");
