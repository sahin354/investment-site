// firebaseConfig.js - REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL FIREBASE CONFIG VALUES

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBqnJpGCtplUIwspovyntn9bbaTY2ygLNE",
  authDomain: "adani-investment.firebaseapp.com",
  projectId: "adani-investment",
  storageBucket: "adani-investment.firebasestorage.app",
  messagingSenderId: "549652082720",
  appId: "1:549652082720:web:09bc0f371a498ee5184c45",
  measurementId: "G-TGFHW9XKF2"                                // <--- !!! IMPORTANT: REPLACE THIS !!!
  // Optional: If you use Google Analytics
  // measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Export them for use in other JavaScript files
export { 
  app, 
  db, 
  auth, 
  functions, 
  httpsCallable 
};
  
