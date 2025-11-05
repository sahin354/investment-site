// System Control Panel JavaScript - FINAL & FIXED
console.log('🔧 Admin panel script loading...');

// --- GLOBAL VARIABLES ---
let allUsers = [];
let currentAdmin = null;
// --- THIS WAS THE FIX. The broken [cite] text is gone. ---
const SYSTEM_ADMINS = ["sahin54481@gmail.com", "admin@adani.com"];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded, initializing admin panel...');
    initializeAdminPanel();
});

function initializeAdminPanel() {
    console.log('🚀 Starting admin panel initialization...');
    checkAdminAuth();
}

// --- AUTHENTICATION ---
function checkAdminAuth() {
    console.log('🔐 Checking admin authentication...');
    firebase.auth().onAuthStateChanged(user => {
        if (user && SYSTEM_ADMINS.includes(user.email.toLowerCase())) {
            currentAdmin = user;
            console.log('✅ Admin access granted for:', user.email);
            showControlPanel();
        } else {
            if (user) {
                console.log('❌ Access denied for non-admin:', user.email);
                alert('Access Denied: Administrator privileges required.');
                firebase.auth().signOut();
            } else {
                console.log('🔐 No authenticated user, redirecting to login...');
            }
            window.location.href = 'system-control.html';
        }
    }, error => {
        console.error('❌ Auth state error:', error);
        window.location.href = 'system-control.html';
    });
}


// --- MAIN PANEL LOGIC ---
function showControlPanel() {
    console.log('🎯 Showing control panel and loading data...');
    loadDashboardStats();
    loadUsers();
    setupAllEventListeners();
    console.log('✅ Control panel fully loaded!');
}

function setupAllEventListeners() {
    console.log('⚙️ Setting up event listeners...');
    // Tab switching
    document.querySelectorAll('.control-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            document.querySelectorAll('.control-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
            document.getElementById(tabName + 'Tab').classList.add('active');
            if (tabName === 'balance') loadUserDropdown();
            if (tabName === 'plans') loadPlans();
        });
    });

    // Buttons
    document.getElementById('logoutButton').addEventListener('click', logoutControl);
    document.getElementById('updateBalanceButton').addEventListener('click', updateUserBalance); 
    document.getElementById('saveSettingsButton').addEventListener('click', saveSystemSettings);
    document.getElementById('searchUser').addEventListener('input', renderUsersTable);

    // Plan Management Event Listeners
    const planModal = document.getElementById('planModal');
    document.getElementById('createNewPlanBtn').addEventListener('click', () => showPlanForm());
    document.getElementById('closePlanModal').addEventListener('click', () => planModal.style.display = 'none');
    document.getElementById('planForm').addEventListener('submit', savePlan);

    // Auto-calculate total return
    const dailyReturnInput = document.getElementById('planDailyReturn');
    const durationInput = document.getElementById('planDuration');
    const totalReturnInput = document.getElementById('planTotalReturn');
    const calculateTotal = () => {
        const daily = parseFloat(dailyReturnInput.value) || 0;
        const duration = parseInt(durationInput.value) || 0;
        totalReturnInput.value = (daily * duration).toFixed(2);
    };
    dailyReturnInput.addEventListener('input', calculateTotal);
    durationInput.addEventListener('input', calculateTotal);

    window.onclick = event => {
        if (event.target == planModal) planModal.style.display = "none";
    };
    
    // --- NEW: User Details Modal Listeners ---
    const userDetailsModal = document.getElementById('userDetailsModal');
    document.getElementById('closeUserDetailsModal').addEventListener('click', () => {
        userDetailsModal.style.display = 'none';
    });
    
    // Use event delegation for clicking on a user row
    document.getElementById('usersTableBody').addEventListener('click', (e) => {
        // Find the closest parent <td> or <a> with the class 'user-link'
        const userLink = e.target.closest('.user-link');
        if (userLink) {
            const userId = userLink.dataset.userid;
            openUserDetailsModal(userId);
        }
    });

    console.log('✅ All event listeners setup complete.');
}

// --- PLAN MANAGEMENT FUNCTIONS (UNCHANGED) ---
function loadPlans(){console.log('📈 Loading investment plans...');const plansContainer=document.getElementById('plansContainer');plansContainer.innerHTML='<p>Loading plans...</p>';const plansRef=firebase.firestore().collection('investmentPlans').orderBy('isVIP','desc').orderBy('minAmount','asc');plansRef.onSnapshot(snapshot=>{if(snapshot.empty){plansContainer.innerHTML='<p>No investment plans found. Click "Create New Plan" to add one.</p>';return}plansContainer.innerHTML='';snapshot.forEach(doc=>{const plan={id:doc.id,...doc.data()};const planCard=document.createElement('div');planCard.className=`plan-card ${plan.isVIP?'vip':''}`;planCard.innerHTML=`<div class="plan-header"><div class="plan-title">${plan.name} ${plan.isVIP?'<span class="vip-badge">VIP</span>':''}</div><span style="color: ${plan.isActive?'green':'gray'}; font-weight: bold;">${plan.isActive?'● Active':'● Inactive'}</span></div><div class="plan-details"><div><strong>INVESTMENT</strong>₹${plan.minAmount.toLocaleString()}</div><div><strong>DAILY EARN</strong>${plan.dailyReturnPercent}%</div><div><strong>DURATION</strong>${plan.durationDays} Days</div><div><strong>TOTAL EARN</strong>${plan.totalReturnPercent}%</div></div><div class="plan-actions"><button class="action-btn edit-btn" data-planid="${plan.id}">Edit</button><button class="action-btn block-btn" data-planid="${plan.id}" data-status="${plan.isActive}">${plan.isActive?'Deactivate':'Activate'}</button></div>`;plansContainer.appendChild(planCard)});plansContainer.querySelectorAll('.edit-btn').forEach(btn=>btn.addEventListener('click',e=>{const planId=e.target.closest('.edit-btn').dataset.planid;firebase.firestore().collection('investmentPlans').doc(planId).get().then(doc=>showPlanForm({id:doc.id,...doc.data()}))}));plansContainer.querySelectorAll('.block-btn').forEach(btn=>btn.addEventListener('click',e=>{const planId=e.target.closest('.block-btn').dataset.planid;const currentStatus=e.target.closest('.block-btn').dataset.status==='true';togglePlanStatus(planId,!currentStatus)}))},error=>{console.error("Error loading plans: ",error);plansContainer.innerHTML='<p style="color: red;">Could not load plans.</p>'})}
function showPlanForm(plan=null){const modal=document.getElementById('planModal');const form=document.getElementById('planForm');form.reset();document.getElementById('planModalTitle').textContent=plan?'Edit Plan':'Create New Plan';document.getElementById('planId').value=plan?plan.id:'';if(plan){document.getElementById('planName').value=plan.name;document.getElementById('planMinAmount').value=plan.minAmount;document.getElementById('planDuration').value=plan.durationDays;document.getElementById('planDailyReturn').value=plan.dailyReturnPercent;document.getElementById('planTotalReturn').value=plan.totalReturnPercent;document.getElementById('planIsVIP').checked=plan.isVIP}const deleteBtn=document.getElementById('deletePlanBtn');deleteBtn.style.display=plan?'inline-block':'none';deleteBtn.onclick=()=>deletePlan(plan.id);modal.style.display='block'}
function savePlan(e){e.preventDefault();const planId=document.getElementById('planId').value;const planData={name:document.getElementById('planName').value,minAmount:parseFloat(document.getElementById('planMinAmount').value),durationDays:parseInt(document.getElementById('planDuration').value),dailyReturnPercent:parseFloat(document.getElementById('planDailyReturn').value),totalReturnPercent:parseFloat(document.getElementById('planTotalReturn').value),isVIP:document.getElementById('planIsVIP').checked};let promise;if(planId){promise=firebase.firestore().collection('investmentPlans').doc(planId).update(planData)}else{planData.isActive=true;planData.createdAt=firebase.firestore.FieldValue.serverTimestamp();promise=firebase.firestore().collection('investmentPlans').add(planData)}promise.then(()=>{console.log('✅ Plan saved successfully');document.getElementById('planModal').style.display='none'}).catch(error=>{console.error('❌ Error saving plan:',error);alert('Error saving plan: '+error.message)})}
function togglePlanStatus(planId,newStatus){const action=newStatus?'activate':'deactivate';if(!confirm(`Are you sure you want to ${action} this plan?`))return;firebase.firestore().collection('investmentPlans').doc(planId).update({isActive:newStatus}).then(()=>console.log(`✅ Plan ${action}d.`)).catch(error=>console.error(`❌ Error ${action}ing plan:`,error))}
function deletePlan(planId){if(!confirm('DANGER: Are you sure you want to permanently delete this plan? This cannot be undone.'))return;firebase.firestore().collection('investmentPlans').doc(planId).delete().then(()=>{console.log('✅ Plan deleted.');document.getElementById('planModal').style.display='none'}).catch(error=>console.error('❌ Error deleting plan:',error))}


// --- DASHBOARD/USER FUNCTIONS ---
function loadDashboardStats(){console.log('📊 Loading dashboard stats...');const usersRef=firebase.firestore().collection('users');usersRef.get().then(snapshot=>{const userCount=snapshot.size;let totalBalance=0;snapshot.forEach(doc=>{totalBalance+=doc.data().balance||0});document.getElementById('totalUsers').textContent=userCount;document.getElementById('activeUsers').textContent=userCount;document.getElementById('totalBalance').textContent='₹'+totalBalance.toLocaleString();console.log('✅ Dashboard stats loaded.')}).catch(error=>console.error('❌ Error loading dashboard stats:',error))}
function loadUsers(){console.log('👥 Loading users...');const usersRef=firebase.firestore().collection('users').orderBy('createdAt','desc');const tbody=document.getElementById('usersTableBody');tbody.innerHTML='<tr><td colspan="6" style="text-align: center;">Loading...</td></tr>';
usersRef.get().then(snapshot=>{allUsers=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));renderUsersTable();console.log(`✅ Loaded ${allUsers.length} users.`)}).catch(error=>{console.error('❌ Error loading users:',error);tbody.innerHTML='<tr><td colspan="6" style="text-align: center; color: red;">Error loading users.</td></tr>'})}

// --- === THIS IS THE UPDATED renderUsersTable FUNCTION === ---
function renderUsersTable() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const usersToRender = searchTerm 
        ? allUsers.filter(user => (user.email && user.email.toLowerCase().includes(searchTerm)) || user.id.toLowerCase().includes(searchTerm)) 
        : allUsers;

    if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No users found.</td></tr>';
        return;
    }
    
    usersToRender.forEach(user => {
        const tr = document.createElement('tr');
        const joinDate = user.createdAt && user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        const isBlocked = user.isBlocked || false;
        
        tr.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td class="user-link" data-userid="${user.id}" style="color: blue; cursor: pointer; text-decoration: underline;">
                ${user.email || 'N/A'}
            </td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${joinDate}</td>
            <td>${isBlocked ? 'Blocked' : 'Active'}</td>
            <td>
                <button class="action-btn block-btn" data-userid="${user.id}" data-is-blocked="${isBlocked}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Re-attach listener for block buttons
    tbody.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // Stop it from opening the modal
            const userId = this.dataset.userid;
            const isBlocked = this.dataset.isBlocked === 'true';
            toggleUserBlock(userId, !isBlocked);
        });
    });
}
// --- === END OF UPDATED FUNCTION === ---


function toggleUserBlock(userId,shouldBlock){const action=shouldBlock?'block':'unblock';if(!confirm(`Are you sure you want to ${action} this user?`))return;firebase.firestore().collection('users').doc(userId).update({isBlocked:shouldBlock}).then(()=>{alert(`User ${action}ed successfully!`);loadUsers()}).catch(error=>console.error(`❌ Error ${action}ing user:`,error))}
function loadUserDropdown(){console.log('📋 Loading user dropdown...');const select=document.getElementById('userSelect');select.innerHTML='<option value="">Select a user...</option>';allUsers.sort((a,b)=>a.email.localeCompare(b.email)).forEach(user=>{const option=document.createElement('option');option.value=user.id;option.textContent=`${user.email} (Balance: ₹${(user.balance||0).toFixed(2)})`;select.appendChild(option)})}

function updateUserBalance() {
    const userId = document.getElementById('userSelect').value;
    const action = document.getElementById('balanceAction').value;
    const amount = parseFloat(document.getElementById('balanceAmount').value);
    const reason = document.getElementById('balanceReason').value; 

    if (!userId || !amount || amount <= 0) {
        alert('Please select a user and enter a valid positive amount.');
        return;
    }

    const db = firebase.firestore(); 
    const userRef = db.collection('users').doc(userId);
    const txRef = db.collection('transactions').doc(); 

    firebase.firestore().runTransaction(transaction => {
        return transaction.get(userRef).then(userDoc => {
            if (!userDoc.exists) throw new Error("User not found!");
            
            const userData = userDoc.data();
            const currentBalance = userData.balance || 0;
            let newBalance;
            let txAmount;
            let txType;

            if (action === 'add') {
                newBalance = currentBalance + amount;
                txAmount = amount; 
                txType = 'Deposit';
            } else if (action === 'subtract') {
                newBalance = currentBalance - amount;
                txAmount = -amount; 
                txType = 'Withdrawal';
            } else if (action === 'set') {
                newBalance = amount;
                txAmount = amount - currentBalance; 
                txType = 'Adjustment';
            }

            if (newBalance < 0) throw new Error("Balance cannot be negative.");

            transaction.update(userRef, { balance: newBalance });
            transaction.set(txRef, {
                userId: userId,
                userEmail: userData.email,
                type: txType, 
                amount: txAmount,
                details: reason, 
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
    }).then(() => {
        alert('Balance updated and transaction logged!');
        loadUsers();
        loadDashboardStats();
    }).catch(error => {
        console.error('❌ Error updating balance:', error);
        alert('Failed to update balance: ' + error.message);
    });
}

function saveSystemSettings(){console.log('💾 Saving system settings...');const settings={commission1:parseFloat(document.getElementById('commission1').value),commission2:parseFloat(document.getElementById('commission2').value),commission3:parseFloat(document.getElementById('commission3').value),minWithdrawal:parseFloat(document.getElementById('minWithdrawal').value),maxWithdrawal:parseFloat(document.getElementById('maxWithdrawal').value)};firebase.firestore().collection('systemSettings').doc('config').set(settings,{merge:true}).then(()=>alert('✅ System settings saved successfully!')).catch(error=>{console.error('❌ Error saving settings:',error);alert('Error saving settings.')})}
function logoutControl(){console.log('🔒 Logging out...');if(confirm('Are you sure you want to secure logout?')){firebase.auth().signOut().then(()=>window.location.href='system-control.html').catch(error=>console.error('❌ Logout error:',error))}}


// --- === NEW FUNCTIONS FOR USER DETAILS MODAL === ---

async function openUserDetailsModal(userId) {
    const modal = document.getElementById('userDetailsModal');
    const title = document.getElementById('userDetailsTitle');
    const detailsContent = document.getElementById('userDetailsContent');
    
    title.textContent = 'Loading User Details...';
    detailsContent.innerHTML = '<p>Loading...</p>';
    modal.style.display = 'block';

    try {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            title.textContent = 'Error';
            detailsContent.innerHTML = '<p>User not found.</p>';
            return;
        }

        const user = userDoc.data();
        title.textContent = `Details for ${user.email}`;
        
        // Populate Bank Details
        detailsContent.innerHTML = `
            <h4>Bank Account Details</h4>
            <div class="user-details-grid">
                <div><strong>Name:</strong> ${user.bankRealName || 'N/A'}</div>
                <div><strong>Account:</strong> ${user.bankAccount || 'N/A'}</div>
                <div><strong>IFSC:</strong> ${user.bankIFSC || 'N/A'}</div>
                <div><strong>UPI:</strong> ${user.bankUPI || 'N/A'}</div>
            </div>
        `;

        // Load transactions
        loadUserTransactions(userId);

    } catch (error) {
        console.error("Error opening user details:", error);
        title.textContent = 'Error';
        detailsContent.innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

// (Helper function copied from script-mine.js)
function getTransactionIcon(type) {
    const cleanType = type.toLowerCase();
    
    if (cleanType.includes('invest')) return '💼'; 
    if (cleanType.includes('earning')) return '📈'; 
    if (cleanType.includes('deposit')) return '📥'; 
    if (cleanType.includes('withdrawal')) return '📤';
    if (cleanType.includes('adjust')) return '🔧'; 
    return '📄'; 
}

async function loadUserTransactions(userId) {
    const listContainer = document.getElementById('userTransactionList');
    listContainer.innerHTML = '<p>Loading transactions...</p>';
    const db = firebase.firestore();
    
    // Using .get() and sorting in JS to avoid index issues
    const txQuery = db.collection('transactions').where('userId', '==', userId);
                          
    try {
        const snapshot = await txQuery.get();
        
        if (snapshot.empty) {
            // --- THIS IS A FIX: Corrected the closing </p> tag ---
            listContainer.innerHTML = '<p>No transactions found.</p>';
            return;
        }
        
        listContainer.innerHTML = ''; 

        const docs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        docs.sort((a, b) => {
            const dateA = a.timestamp ? a.timestamp.seconds : 0;
            const dateB = b.timestamp ? b.timestamp.seconds : 0;
            return dateB - dateA; 
        });

        docs.forEach((tx) => {
            const amount = tx.amount;
            const date = tx.timestamp ? tx.timestamp.toDate().toLocaleDateString() : 'Just now';
      
