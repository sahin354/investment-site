// firebaseConfig.js - FOR CDN-BASED (NON-MODULE) SETUP

// Your web app's Firebase configuration
// You MUST REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL FIREBASE CONFIG VALUES
const firebaseConfig = {
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDvRtYzrmOix6TF3ap2u5n8Bz1u8Mptdw",
  authDomain: "final-adani.firebaseapp.com",
  projectId: "final-adani",
  storageBucket: "final-adani.firebasestorage.app",
  messagingSenderId: "174751903869",
  appId: "1:174751903869:web:763b0e23f421b09b9ec114",
  measurementId: "G-8BPS95G0V7"
};                                
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
