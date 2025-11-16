// firebaseConfig.js - FOR CDN-BASED (NON-MODULE) SETUP

// Your web app's Firebase configuration
// You MUST REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL FIREBASE CONFIG VALUES
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2"                                
  // Optional: If you use Google Analytics
  // measurementId: "G-XXXXXXXXXX" 
};

// Initialize Firebase (makes 'firebase' global)
firebase.initializeApp(firebaseConfig);

// Get references to Firebase services (these become globally accessible through firebase.auth(), firebase.firestore(), etc.)
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions(); // Initialize Cloud Functions

// No exports needed as everything is accessed globally
