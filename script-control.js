// System Control Panel JavaScript - FINAL & FIXED with User Details Feature
console.log('🔧 Admin panel script loading...');

// --- GLOBAL VARIABLES ---
let allUsers = [];
let currentAdmin = null;
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

    // User Details Modal Event Listeners
    document.getElementById('closeUserDetailsModal').addEventListener('click', () => {
        document.getElementById('userDetailsModal').style.display = 'none';
    });
    
    document.getElementById('editBankDetails').addEventListener('click', showBankEditForm);
    document.getElementById('removeBankDetails').addEventListener('click', removeUserBankDetails);
    document.getElementById('saveBankDetails').addEventListener('click', saveBankDetails);
    document.getElementById('cancelBankEdit').addEventListener('click', cancelBankEdit);

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
        const planModal = document.getElementById('planModal');
        const userDetailsModal = document.getElementById('userDetailsModal');
        if (event.target == planModal) planModal.style.display = "none";
        if (event.target == userDetailsModal) userDetailsModal.style.display = "none";
    };

    console.log('✅ All event listeners setup complete.');
}

// --- PLAN MANAGEMENT FUNCTIONS ---
function loadPlans(){console.log('📈 Loading investment plans...');const plansContainer=document.getElementById('plansContainer');plansContainer.innerHTML='<p>Loading plans...</p>';const plansRef=firebase.firestore().collection('investmentPlans').orderBy('isVIP','desc').orderBy('minAmount','asc');plansRef.onSnapshot(snapshot=>{if(snapshot.empty){plansContainer.innerHTML='<p>No investment plans found. Click "Create New Plan" to add one.</p>';return}plansContainer.innerHTML='';snapshot.forEach(doc=>{const plan={id:doc.id,...doc.data()};const planCard=document.createElement('div');planCard.className=`plan-card ${plan.isVIP?'vip':''}`;planCard.innerHTML=`<div class="plan-header"><div class="plan-title">${plan.name} ${plan.isVIP?'<span class="vip-badge">VIP</span>':''}</div><span style="color: ${plan.isActive?'green':'gray'}; font-weight: bold;">${plan.isActive?'● Active':'● Inactive'}</span></div><div class="plan-details"><div><strong>INVESTMENT</strong>₹${plan.minAmount.toLocaleString()}</div><div><strong>DAILY EARN</strong>${plan.dailyReturnPercent}%</div><div><strong>DURATION</strong>${plan.durationDays} Days</div><div><strong>TOTAL EARN</strong>${plan.totalReturnPercent}%</div></div><div class="plan-actions"><button class="action-btn edit-btn" data-planid="${plan.id}">Edit</button><button class="action-btn block-btn" data-planid="${plan.id}" data-status="${plan.isActive}">${plan.isActive?'Deactivate':'Activate'}</button></div>`;plansContainer.appendChild(planCard)});plansContainer.querySelectorAll('.edit-btn').forEach(btn=>btn.addEventListener('click',e=>{const planId=e.target.closest('.edit-btn').dataset.planid;firebase.firestore().collection('investmentPlans').doc(planId).get().then(doc=>showPlanForm({id:doc.id,...doc.data()}))}));plansContainer.querySelectorAll('.block-btn').forEach(btn=>btn.addEventListener('click',e=>{const planId=e.target.closest('.block-btn').dataset.planid;const currentStatus=e.target.closest('.block-btn').dataset.status==='true';togglePlanStatus(planId,!currentStatus)}))},error=>{console.error("Error loading plans: ",error);plansContainer.innerHTML='<p style="color: red;">Could not load plans.</p>'})}
function showPlanForm(plan=null){const modal=document.getElementById('planModal');const form=document.getElementById('planForm');form.reset();document.getElementById('planModalTitle').textContent=plan?'Edit Plan':'Create New Plan';document.getElementById('planId').value=plan?plan.id:'';if(plan){document.getElementById('planName').value=plan.name;document.getElementById('planMinAmount').value=plan.minAmount;document.getElementById('planDuration').value=plan.durationDays;document.getElementById('planDailyReturn').value=plan.dailyReturnPercent;document.getElementById('planTotalReturn').value=plan.totalReturnPercent;document.getElementById('planIsVIP').checked=plan.isVIP}const deleteBtn=document.getElementById('deletePlanBtn');deleteBtn.style.display=plan?'inline-block':'none';deleteBtn.onclick=()=>deletePlan(plan.id);modal.style.display='block'}
function savePlan(e){e.preventDefault();const planId=document.getElementById('planId').value;const planData={name:document.getElementById('planName').value,minAmount:parseFloat(document.getElementById('planMinAmount').value),durationDays:parseInt(document.getElementById('planDuration').value),dailyReturnPercent:parseFloat(document.getElementById('planDailyReturn').value),totalReturnPercent:parseFloat(document.getElementById('planTotalReturn').value),isVIP:document.getElementById('planIsVIP').checked};let promise;if(planId){promise=firebase.firestore().collection('investmentPlans').doc(planId).update(planData)}else{planData.isActive=true;planData.createdAt=firebase.firestore.FieldValue.serverTimestamp();promise=firebase.firestore().collection('investmentPlans').add(planData)}promise.then(()=>{console.log('✅ Plan saved successfully');document.getElementById('planModal').style.display='none'}).catch(error=>{console.error('❌ Error saving plan:',error);alert('Error saving plan: '+error.message)})}
function togglePlanStatus(planId,newStatus){const action=newStatus?'activate':'deactivate';if(!confirm(`Are you sure you want to ${action} this plan?`))return;firebase.firestore().collection('investmentPlans').doc(planId).update({isActive:newStatus}).then(()=>console.log(`✅ Plan ${action}d.`)).catch(error=>console.error(`❌ Error ${action}ing plan:`,error))}
function deletePlan(planId){if(!confirm('DANGER: Are you sure you want to permanently delete this plan? This cannot be undone.'))return;firebase.firestore().collection('investmentPlans').doc(planId).delete().then(()=>{console.log('✅ Plan deleted.');document.getElementById('planModal').style.display='none'}).catch(error=>console.error('❌ Error deleting plan:',error))}

// --- DASHBOARD/USER FUNCTIONS ---
function loadDashboardStats(){console.log('📊 Loading dashboard stats...');const usersRef=firebase.firestore().collection('users');usersRef.get().then(snapshot=>{const userCount=snapshot.size;let totalBalance=0;snapshot.forEach(doc=>{totalBalance+=doc.data().balance||0});document.getElementById('totalUsers').textContent=userCount;document.getElementById('activeUsers').textContent=userCount;document.getElementById('totalBalance').textContent='₹'+totalBalance.toLocaleString();console.log('✅ Dashboard stats loaded.')}).catch(error=>console.error('❌ Error loading dashboard stats:',error))}
function loadUsers(){console.log('👥 Loading users...');const usersRef=firebase.firestore().collection('users').orderBy('createdAt','desc');const tbody=document.getElementById('usersTableBody');tbody.innerHTML='<tr><td colspan="10" style="text-align: center;">Loading...</td></tr>';usersRef.get().then(snapshot=>{allUsers=snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));renderUsersTable();console.log(`✅ Loaded ${allUsers.length} users.`)}).catch(error=>{console.error('❌ Error loading users:',error);tbody.innerHTML='<tr><td colspan="10" style="text-align: center; color: red;">Error loading users.</td></tr>'})}

// --- UPDATED USER TABLE RENDER FUNCTION WITH CLICKABLE EMAILS ---
function renderUsersTable() {
    const searchTerm = document.getElementById('searchUser').value.toLowerCase();
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    const usersToRender = searchTerm 
        ? allUsers.filter(user => (user.email && user.email.toLowerCase().includes(searchTerm)) || user.id.toLowerCase().includes(searchTerm)) 
        : allUsers;

    if (usersToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center;">No users found.</td></tr>';
        return;
    }
    
    usersToRender.forEach(user => {
        const tr = document.createElement('tr');
        const joinDate = user.createdAt && user.createdAt.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        const isBlocked = user.isBlocked || false;
        
        tr.innerHTML = `
            <td>${user.id.substring(0, 8)}...</td>
            <td>
                <a href="#" class="user-email-link" data-userid="${user.id}" style="color: #1a237e; text-decoration: underline;">
                    ${user.email || 'N/A'}
                </a>
            </td>
            <td>₹${(user.balance || 0).toFixed(2)}</td>
            <td>${joinDate}</td>
            <td>${isBlocked ? 'Blocked' : 'Active'}</td>
            <td>${user.bankName || 'N/A'}</td>
            <td>${user.bankAccount || 'N/A'}</td>
            <td>${user.bankIFSC || 'N/A'}</td>
            <td>${user.bankUPI || 'N/A'}</td>
            <td>
                <button class="action-btn block-btn" data-userid="${user.id}" data-is-blocked="${isBlocked}">
                    ${isBlocked ? 'Unblock' : 'Block'}
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Re-attach listeners for block buttons
    tbody.querySelectorAll('.block-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const userId = this.dataset.userid;
            const isBlocked = this.dataset.isBlocked === 'true';
            toggleUserBlock(userId, !isBlocked);
        });
    });
    
    // Add click listeners to email links
    tbody.querySelectorAll('.user-email-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.dataset.userid;
            showUserDetails(userId);
        });
    });
}

// --- NEW USER DETAILS FUNCTIONS ---
function showUserDetails(userId) {
    console.log('👤 Loading user details for:', userId);
    const modal = document.getElementById('userDetailsModal');
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) {
        alert('User not found!');
        return;
    }
    
    // Set modal title
    document.getElementById('userDetailsTitle').textContent = `User Details - ${user.email}`;
    
    // Display bank details
    document.getElementById('detailBankName').textContent = user.bankName || 'N/A';
    document.getElementById('detailBankRealName').textContent = user.bankRealName || 'N/A';
    document.getElementById('detailBankAccount').textContent = user.bankAccount || 'N/A';
    document.getElementById('detailBankIFSC').textContent = user.bankIFSC || 'N/A';
    document.getElementById('detailBankUPI').textContent = user.bankUPI || 'N/A';
    
    // Store current user ID for editing
    modal.dataset.currentUserId = userId;
    
    // Hide edit form initially
    document.getElementById('bankEditForm').style.display = 'none';
    
    // Load transaction history
    loadUserTransactions(userId);
    
    // Show modal
    modal.style.display = 'block';
}

function loadUserTransactions(userId) {
    const transactionList = document.getElementById('userTransactionList');
    transactionList.innerHTML = '<p>Loading transactions...</p>';
    
    firebase.firestore().collection('transactions')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(50)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                transactionList.innerHTML = '<p>No transactions found.</p>';
                return;
            }
            
            transactionList.innerHTML = '';
            snapshot.forEach(doc => {
                const tx = doc.data();
                const item = document.createElement('div');
                item.className = 'transaction-item modern';
                
                const date = tx.timestamp && tx.timestamp.seconds 
                    ? new Date(tx.timestamp.seconds * 1000).toLocaleString()
                    : 'Unknown date';
                
                const amountClass = tx.amount >= 0 ? 'positive' : 'negative';
                const amountSign = tx.amount >= 0 ? '+' : '';
                
                item.innerHTML = `
                    <div class="transaction-icon">💰</div>
                    <div class="transaction-details">
                        <div class="transaction-type">${tx.type || 'Transaction'}</div>
                        <div class="transaction-info">${tx.details || 'No details'}</div>
                        <div class="transaction-date">${date}</div>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${amountSign}₹${Math.abs(tx.amount).toFixed(2)}
                    </div>
                `;
                
                transactionList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('❌ Error loading transactions:', error);
            transactionList.innerHTML = '<p style="color: red;">Error loading transactions.</p>';
        });
}

function showBankEditForm() {
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    const user = allUsers.find(u => u.id === userId);
    
    if (!user) return;
    
    // Populate form with current values
    document.getElementById('editBankName').value = user.bankName || '';
    document.getElementById('editBankRealName').value = user.bankRealName || '';
    document.getElementById('editBankAccount').value = user.bankAccount || '';
    document.getElementById('editBankIFSC').value = user.bankIFSC || '';
    document.getElementById('editBankUPI').value = user.bankUPI || '';
    
    // Show edit form
    document.getElementById('bankEditForm').style.display = 'block';
}

function cancelBankEdit() {
    document.getElementById('bankEditForm').style.display = 'none';
}

function saveBankDetails() {
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    
    const bankData = {
        bankName: document.getElementById('editBankName').value,
        bankRealName: document.getElementById('editBankRealName').value,
        bankAccount: document.getElementById('editBankAccount').value,
        bankIFSC: document.getElementById('editBankIFSC').value,
        bankUPI: document.getElementById('editBankUPI').value
    };
    
    firebase.firestore().collection('users').doc(userId).update(bankData)
        .then(() => {
            alert('✅ Bank details updated successfully!');
            // Update local data
            const userIndex = allUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                allUsers[userIndex] = { ...allUsers[userIndex], ...bankData };
            }
            // Refresh the display
            showUserDetails(userId);
            renderUsersTable(); // Update table
        })
        .catch(error => {
            console.error('❌ Error updating bank details:', error);
            alert('Error updating bank details: ' + error.message);
        });
}

function removeUserBankDetails() {
    if (!confirm('Are you sure you want to remove all bank details for this user?')) {
        return;
    }
    
    const modal = document.getElementById('userDetailsModal');
    const userId = modal.dataset.currentUserId;
    
    const bankData = {
        bankName: null,
        bankRealName: null,
        bankAccount: null,
        bankIFSC: null,
        bankUPI: null
    };
    
    firebase.firestore().collection('users').doc(userId).update(bankData)
        .then(() => {
            alert('✅ Bank details removed successfully!');
            // Update local data
            const userIndex = allUsers.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                allUsers[userIndex] = { ...allUsers[userIndex], ...bankData };
            }
            // Refresh the display
            showUserDetails(userId);
            renderUsersTable(); // Update table
        })
        .catch(error => {
            console.error('❌ Error removing bank details:', error);
            alert('Error removing bank details: ' + error.message);
        });
}

// --- EXISTING FUNCTIONS ---
function toggleUserBlock(userId,shouldBlock){const action=shouldBlock?'block':'unblock';if(!confirm(`Are you sure you want to ${a
