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
const auth = firebase.auth();
const db = firebase.firestore();

// --- Auth Guard ---
auth.onAuthStateChanged(user => {
    if (!user) {
        // If no user is logged in, redirect to the login page
        window.location.href = 'login.html';
    }
});

// --- Logout ---
document.getElementById('logoutBtn').addEventListener('click', () => {
    auth.signOut().then(() => {
        window.location.href = 'login.html';
    });
});

// --- Page Navigation ---
const pages = document.querySelectorAll('.page');
const navLinks = document.querySelectorAll('.sidebar a');
const pageTitle = document.getElementById('page-title');

navLinks.forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        if(link.id === 'logoutBtn') return;

        const pageId = link.getAttribute('data-page');

        // Toggle active class on links
        navLinks.forEach(nav => nav.classList.remove('active'));
        link.classList.add('active');

        // Show the correct page
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');

        // Update title
        pageTitle.textContent = link.textContent;
    });
});


// --- Data Loading ---
// Load dashboard stats
db.collection('users').get().then(snapshot => {
    document.getElementById('total-users').textContent = snapshot.size;
});

// Load user list
const userList = document.getElementById('user-list');
db.collection('users').get().then(snapshot => {
    let html = '<ul>';
    snapshot.forEach(doc => {
        const user = doc.data();
        html += `<li>${user.phone || 'No phone'} - Registered at: ${new Date().toLocaleDateString()}</li>`;
    });
    html += '</ul>';
    userList.innerHTML = html;
});

// Load plans
// (Assuming you have a 'plans' collection similar to what we discussed before)
