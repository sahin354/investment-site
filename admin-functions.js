// ========================================
// ADMIN PANEL CORE FUNCTIONS
// ========================================

class AdminFunctions {
    constructor() {
        this.currentUser = null;
        this.allUsers = [];
        this.paymentRequests = { deposits: [], withdrawals: [] };
        this.plans = [];
        this.systemSettings = {};
        
        this.init();
    }
    
    async init() {
        await this.checkAdminAuth();
        this.loadDashboard();
        this.setupEventListeners();
        this.startRealTimeUpdates();
    }
    
    // ========== AUTHENTICATION ==========
    async checkAdminAuth() {
        return new Promise((resolve) => {
            firebase.auth().onAuthStateChanged(async (user) => {
                if (user) {
                    const isAdmin = await this.validateAdmin(user.email);
                    if (isAdmin) {
                        this.currentUser = user;
                        this.setupAdminUI(user);
                        resolve(true);
                    } else {
                        this.logout();
                    }
                } else {
                    window.location.href = 'system-control.html';
                }
            });
        });
    }
    
    async validateAdmin(email) {
        const normalizedEmail = email.toLowerCase();
        const SYSTEM_ADMINS = ["sahin54481@gmail.com", "admin@adani.com"]
            .map(e => e.toLowerCase());
        
        if (SYSTEM_ADMINS.includes(normalizedEmail)) {
            await adminSecurity.logSuccessLogin(await adminSecurity.getClientIP(), email);
            return true;
        }
        
        await adminSecurity.logFailedAttempt(
            await adminSecurity.getClientIP(), 
            email, 
            'Non-admin attempt'
        );
        return false;
    }
    
    setupAdminUI(user) {
        // Set admin info
        document.getElementById('adminEmail').textContent = user.email;
        document.getElementById('adminName').textContent = 
            user.displayName || user.email.split('@')[0];
        document.getElementById('adminAvatar').textContent = 
            user.email.charAt(0).toUpperCase();
    }
    
    logout() {
        adminSecurity.logAdminAction('LOGOUT', {});
        firebase.auth().signOut();
        window.location.href = 'system-control.html';
    }
    
    // ========== DASHBOARD ==========
    async loadDashboard() {
        await this.loadDashboardStats();
        await this.loadRecentActivity();
        this.updateBadges();
    }
    
    async loadDashboardStats() {
        try {
            // Total Users
            const usersSnapshot = await firebase.firestore().collection('users').get();
            document.getElementById('totalUsers').textContent = usersSnapshot.size;
            
            // Total Balance
            let totalBalance = 0;
            usersSnapshot.forEach(doc => {
                totalBalance += parseFloat(doc.data().balance || 0);
            });
            document.getElementById('totalBalance').textContent = `₹${totalBalance.toLocaleString()}`;
            
            // Active Users (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const activeQuery = await firebase.firestore()
                .collection('userActivity')
                .where('timestamp', '>', yesterday)
                .get();
            const activeUsers = new Set();
            activeQuery.forEach(doc => activeUsers.add(doc.data().userId));
            document.getElementById('activeUsers').textContent = activeUsers.size;
            
            // Monthly Profit (example calculation)
            const monthlyProfit = totalBalance * 0.05; // 5% of total balance
            document.getElementById('monthlyProfit').textContent = `₹${monthlyProfit.toLocaleString()}`;
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
    
    async loadRecentActivity() {
        try {
            const activityRef = firebase.firestore()
                .collection('securityLogs')
                .orderBy('timestamp', 'desc')
                .limit(20);
            
            activityRef.onSnapshot(snapshot => {
                const tbody = document.getElementById('activityTable');
                tbody.innerHTML = '';
                
                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" style="text-align: center; padding: 40px;">
                                No recent activity
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                snapshot.forEach(doc => {
                    const data = doc.data();
                    const time = new Date(data.timestamp).toLocaleString();
                    
                    const row = `
                        <tr>
                            <td>${time}</td>
                            <td>${data.email || data.adminEmail || 'System'}</td>
                            <td>
                                <span class="badge ${this.getEventBadgeClass(data.event)}">
                                    ${data.event}
                                </span>
                            </td>
                            <td>${data.details || data.reason || 'No details'}</td>
                            <td><code>${data.ip || 'Unknown'}</code></td>
                        </tr>
                    `;
                    tbody.innerHTML += row;
                });
            });
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }
    
    getEventBadgeClass(event) {
        switch(event) {
            case 'SUCCESS_LOGIN': return 'badge-success';
            case 'FAILED_LOGIN': return 'badge-danger';
            case 'ADMIN_ACTION': return 'badge-info';
            default: return 'badge-secondary';
        }
    }
    
    // ========== USER MANAGEMENT ==========
    async loadUsers() {
        try {
            const usersRef = firebase.firestore()
                .collection('users')
                .orderBy('createdAt', 'desc');
            
            usersRef.onSnapshot(snapshot => {
                this.allUsers = [];
                const tbody = document.getElementById('usersTable');
                tbody.innerHTML = '';
                
                if (snapshot.empty) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="8" style="text-align: center; padding: 40px;">
                                No users found
                            </td>
                        </tr>
                    `;
                    return;
                }
                
                snapshot.forEach(doc => {
                    const user = { id: doc.id, ...doc.data() };
                    this.allUsers.push(user);
                    
                    const row = this.createUserRow(user);
                    tbody.innerHTML += row;
                });
                
                this.updateUserCount();
                this.setupUserRowListeners();
            });
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    createUserRow(user) {
        const joinDate = user.createdAt ? 
            new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A';
        
        const statusClass = user.isBlocked ? 'badge-danger' : 'badge-success';
        const statusText = user.isBlocked ? 'Blocked' : 'Active';
        
        const bankInfo = user.bankRealName ? 
            `${user.bankRealName.substring(0, 15)}...` : 'Not Set';
        
        return `
            <tr data-user-id="${user.id}">
                <td><code>${user.id.substring(0, 8)}</code></td>
                <td>
                    <div class="user-email">${user.email || 'N/A'}</div>
                    ${user.phone ? `<div class="user-phone">${user.phone}</div>` : ''}
                </td>
                <td>
                    <strong>₹${(user.balance || 0).toFixed(2)}</strong>
                </td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>${bankInfo}</td>
                <td>${joinDate}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="admin.viewUserDetails('${user.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-warning" onclick="admin.editUserBank('${user.id}')">
                            <i class="fas fa-university"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="admin.toggleUserBlock('${user.id}', ${!user.isBlocked})">
                            ${user.isBlocked ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-ban"></i>'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    async viewUserDetails(userId) {
        try {
            const userDoc = await firebase.firestore().collection('users').doc(userId).get();
            if (!userDoc.exists) {
                alert('User not found!');
                return;
            }
            
            const user = userDoc.data();
            const transactions = await this.getUserTransactions(userId);
            
            const content = `
                <div class="user-details-grid">
                    <div><strong>User ID:</strong> ${userId}</div>
                    <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                    <div><strong>Balance:</strong> ₹${(user.balance || 0).toFixed(2)}</div>
                    <div><strong>Status:</strong> ${user.isBlocked ? 'Blocked' : 'Active'}</div>
                    <div><strong>Joined:</strong> ${user.createdAt ? 
                        new Date(user.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4><i class="fas fa-university"></i> Bank Details</h4>
                    <div class="user-details-grid">
                        <div><strong>Account Name:</strong> ${user.bankRealName || 'Not Set'}</div>
                        <div><strong>Account Number:</strong> ${user.bankAccount || 'Not Set'}</div>
                        <div><strong>Bank Name:</strong> ${user.bankName || 'Not Set'}</div>
                        <div><strong>IFSC Code:</strong> ${user.bankIFSC || 'Not Set'}</div>
                        <div><strong>UPI ID:</strong> ${user.bankUPI || 'Not Set'}</div>
                        <div><strong>Verified:</strong> ${user.bankVerified ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4><i class="fas fa-history"></i> Recent Transactions</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${transactions.length > 0 ? 
                            transactions.map(tx => this.formatTransaction(tx)).join('') :
                            '<p>No transactions found</p>'
                        }
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="admin.editUserBank('${userId}')">
                        <i class="fas fa-edit"></i> Edit Bank Details
                    </button>
                    <button class="btn btn-secondary" data-modal="userDetailsModal">
                        Close
                    </button>
                </div>
            `;
            
            document.getElementById('userDetailsContent').innerHTML = content;
            this.openModal('userDetailsModal');
            
        } catch (error) {
            console.error('Error loading user details:', error);
            alert('Error loading user details');
        }
    }
    
    async editUserBank(userId) {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        const user = userDoc.data();
        
        const content = `
            <form id="editBankForm">
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Account Holder Name</label>
                        <input type="text" class="form-control" id="editBankName" 
                               value="${user.bankRealName || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Bank Name</label>
                        <input type="text" class="form-control" id="editBankFullName" 
                               value="${user.bankName || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Account Number</label>
                        <input type="text" class="form-control" id="editAccountNumber" 
                               value="${user.bankAccount || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">IFSC Code</label>
                        <input type="text" class="form-control" id="editIfscCode" 
                               value="${user.bankIFSC || ''}" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">UPI ID</label>
                        <input type="text" class="form-control" id="editUpiId" 
                               value="${user.bankUPI || ''}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Verification Status</label>
                        <select class="form-control" id="editBankVerified">
                            <option value="true" ${user.bankVerified ? 'selected' : ''}>Verified</option>
                            <option value="false" ${!user.bankVerified ? 'selected' : ''}>Not Verified</option>
                        </select>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> Save Changes
                    </button>
                    <button type="button" class="btn btn-secondary" data-modal="userDetailsModal">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById('userDetailsContent').innerHTML = content;
        
        document.getElementById('editBankForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const bankData = {
                bankRealName: document.getElementById('editBankName').value,
                bankName: document.getElementById('editBankFullName').value,
                bankAccount: document.getElementById('editAccountNumber').value,
                bankIFSC: document.getElementById('editIfscCode').value,
                bankUPI: document.getElementById('editUpiId').value,
                bankVerified: document.getElementById('editBankVerified').value === 'true',
                bankUpdatedAt: new Date().toISOString()
            };
            
            try {
                await firebase.firestore().collection('users').doc(userId).update(bankData);
                await adminSecurity.logAdminAction('UPDATE_USER_BANK', { userId, ...bankData });
                alert('Bank details updated successfully!');
                this.closeModal('userDetailsModal');
                this.loadUsers();
            } catch (error) {
                alert('Error updating bank details: ' + error.message);
            }
        });
    }
    
    async toggleUserBlock(userId, shouldBlock) {
        const action = shouldBlock ? 'block' : 'unblock';
        const confirmMsg = shouldBlock ? 
            'Are you sure you want to block this user?' :
            'Are you sure you want to unblock this user?';
        
        if (!confirm(confirmMsg)) return;
        
        try {
            await firebase.firestore().collection('users').doc(userId).update({
                isBlocked: shouldBlock,
                blockedAt: shouldBlock ? new Date().toISOString() : null,
                blockedBy: this.currentUser.email
            });
            
            await adminSecurity.logAdminAction(
                shouldBlock ? 'BLOCK_USER' : 'UNBLOCK_USER', 
                { userId }
            );
            
            alert(`User ${action}ed successfully!`);
            this.loadUsers();
        } catch (error) {
            alert(`Error ${action}ing user: ${error.message}`);
        }
    }
    
    // ========== PAYMENT MANAGEMENT ==========
    async loadPaymentRequests() {
        // Load deposit requests
        const depositsRef = firebase.firestore()
            .collection('depositRequests')
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'desc');
        
        depositsRef.onSnapshot(snapshot => {
            this.paymentRequests.deposits = [];
            const tbody = document.getElementById('depositRequests');
            tbody.innerHTML = '';
            
            snapshot.forEach(doc => {
                const request = { id: doc.id, ...doc.data() };
                this.paymentRequests.deposits.push(request);
                tbody.innerHTML += this.createDepositRow(request);
            });
            
            document.getElementById('depositCount').textContent = snapshot.size;
            this.updatePaymentCount();
        });
        
        // Load withdrawal requests
        const withdrawalsRef = firebase.firestore()
            .collection('withdrawalRequests')
            .where('status', '==', 'pending')
            .orderBy('timestamp', 'desc');
        
        withdrawalsRef.onSnapshot(snapshot => {
            this.paymentRequests.withdrawals = [];
            const tbody = document.getElementById('withdrawalRequests');
            tbody.innerHTML = '';
            
            snapshot.forEach(doc => {
                const request = { id: doc.id, ...doc.data() };
                this.paymentRequests.withdrawals.push(request);
                tbody.innerHTML += this.createWithdrawalRow(request);
            });
            
            document.getElementById('withdrawalCount').textContent = snapshot.size;
            this.updatePaymentCount();
        });
    }
    
    createDepositRow(request) {
        const time = new Date(request.timestamp?.seconds * 1000).toLocaleString();
        const screenshot = request.screenshot ? 
            `<a href="${request.screenshot}" target="_blank" class="btn btn-sm btn-secondary">
                <i class="fas fa-image"></i> View
            </a>` : 'No Screenshot';
        
        return `
            <tr data-deposit-id="${request.id}">
                <td>${time}</td>
                <td>${request.userEmail || 'N/A'}</td>
                <td><strong>₹${request.amount || 0}</strong></td>
                <td><code>${request.utr || 'N/A'}</code></td>
                <td>${screenshot}</td>
                <td>
                    <span class="badge badge-warning">Pending</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-success" onclick="admin.processPayment('deposit', '${request.id}', 'approve')">
                            <i class="fas fa-check"></i> Approve
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="admin.processPayment('deposit', '${request.id}', 'reject')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    createWithdrawalRow(request) {
        const tds = request.amount * 0.18; // 18% TDS
        const payout = request.amount - tds;
        
        return `
            <tr data-withdrawal-id="${request.id}">
                <td>${new Date(request.timestamp?.seconds * 1000).toLocaleDateString()}</td>
                <td>${request.userEmail || 'N/A'}</td>
                <td><strong>₹${request.amount || 0}</strong></td>
                <td>₹${tds.toFixed(2)}</td>
                <td><strong>₹${payout.toFixed(2)}</strong></td>
                <td>
                    ${request.bankName || 'N/A'}<br>
                    <small>A/C: ${request.bankAccount || 'N/A'}</small>
                </td>
                <td>
                    <span class="badge badge-warning">Pending</span>
                </td>
                <td>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-success" onclick="admin.processPayment('withdrawal', '${request.id}', 'approve')">
                            <i class="fas fa-check"></i> Pay
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="admin.processPayment('withdrawal', '${request.id}', 'reject')">
                            <i class="fas fa-times"></i> Reject
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    async processPayment(type, requestId, action) {
        const requestRef = firebase.firestore()
            .collection(`${type}Requests`)
            .doc(requestId);
        
        const requestDoc = await requestRef.get();
        if (!requestDoc.exists) {
            alert('Payment request not found!');
            return;
        }
        
        const request = requestDoc.data();
        
        if (action === 'approve') {
            if (!confirm(`Are you sure you want to approve this ${type} of ₹${request.amount}?`)) {
                return;
            }
            
            const utr = prompt(`Enter UTR/Transaction ID for this ${type}:`);
            if (!utr) return;
            
            try {
                // Update request status
                await requestRef.update({
                    status: 'approved',
                    processedAt: new Date().toISOString(),
                    processedBy: this.currentUser.email,
                    utr: utr
                });
                
                // If it's a withdrawal, deduct from user balance
                if (type === 'withdrawal') {
                    const userRef = firebase.firestore().collection('users').doc(request.userId);
                    const userDoc = await userRef.get();
                    const currentBalance = userDoc.data().balance || 0;
                    
                    await userRef.update({
                        balance: currentBalance - request.amount
                    });
                    
                    // Add transaction record
                    await firebase.firestore().collection('transactions').add({
                        userId: request.userId,
                        userEmail: request.userEmail,
                        type: 'withdrawal',
                        amount: -request.amount,
                        status: 'completed',
                        utr: utr,
                        timestamp: new Date().toISOString(),
                        processedBy: this.currentUser.email
                    });
                }
                
                // If it's a deposit, add to user balance
                if (type === 'deposit') {
                    const userRef = firebase.firestore().collection('users').doc(request.userId);
                    const userDoc = await userRef.get();
                    const currentBalance = userDoc.data().balance || 0;
                    
                    await userRef.update({
                        balance: currentBalance + request.amount
                    });
                    
                    // Add transaction record
                    await firebase.firestore().collection('transactions').add({
                        userId: request.userId,
                        userEmail: request.userEmail,
                        type: 'deposit',
                        amount: request.amount,
                        status: 'completed',
                        utr: utr,
                        timestamp: new Date().toISOString(),
                        processedBy: this.currentUser.email
                    });
                }
                
                await adminSecurity.logAdminAction(
                    `APPROVE_${type.toUpperCase()}`, 
                    { requestId, amount: request.amount, utr }
                );
                
                alert('Payment processed successfully!');
                
            } catch (error) {
                alert('Error processing payment: ' + error.message);
            }
            
        } else if (action === 'reject') {
            const reason = prompt('Enter reason for rejection:');
            if (!reason) return;
            
            try {
                await requestRef.update({
                    status: 'rejected',
                    rejectedAt: new Date().toISOString(),
                    rejectedBy: this.currentUser.email,
                    rejectionReason: reason
                });
                
                await adminSecurity.logAdminAction(
                    `REJECT_${type.toUpperCase()}`, 
                    { requestId, reason }
                );
                
                alert('Payment request rejected!');
            } catch (error) {
                alert('Error rejecting payment: ' + error.message);
            }
        }
    }
    
    // ========== PLAN MANAGEMENT ==========
    async loadPlans() {
        try {
            const plansRef = firebase.firestore()
                .collection('investmentPlans')
                .orderBy('isVIP', 'desc')
                .orderBy('minAmount', 'asc');
            
            plansRef.onSnapshot(snapshot => {
                this.plans = [];
                const grid = document.getElementById('plansGrid');
                
                if (snapshot.empty) {
                    grid.innerHTML = `
                        <div style="text-align: center; padding: 40px;">
                            <i class="fas fa-cube fa-3x" style="color: #ccc; margin-bottom: 20px;"></i>
                            <h4>No plans found</h4>
                            <p>Create your first investment plan</p>
                            <button class="btn btn-primary" onclick="admin.openPlanEditor()">
                                <i class="fas fa-plus"></i> Create Plan
                            </button>
                        </div>
                    `;
                    return;
                }
                
                let plansHTML = '';
                snapshot.forEach(doc => {
                    const plan = { id: doc.id, ...doc.data() };
                    this.plans.push(plan);
                    plansHTML += this.createPlanCard(plan);
                });
                
                grid.innerHTML = plansHTML;
                this.setupPlanCardListeners();
            });
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }
    
    createPlanCard(plan) {
        const vipBadge = plan.isVIP ? 
            '<span class="badge badge-warning" style="position: absolute; top: 10px; right: 10px;">VIP</span>' : '';
        
        const statusBadge = plan.isActive ? 
            '<span class="badge badge-success">Active</span>' : 
            '<span class="badge badge-danger">Inactive</span>';
        
        const image = plan.imageUrl ? 
            `<img src="${plan.imageUrl}" alt="${plan.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">` :
            `<div style="background: linear-gradient(135deg, #667eea, #764ba2); height: 150px; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-cube fa-3x" style="color: white;"></i>
             </div>`;
        
        return `
            <div class="dashboard-card plan-card" data-plan-id="${plan.id}">
                ${vipBadge}
                ${image}
                <div style="margin-top: 15px;">
                    <h4 style="margin: 0 0 10px 0;">${plan.name}</h4>
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        ${statusBadge}
                        <span style="font-weight: bold; color: var(--admin-primary);">
                            ₹${plan.minAmount.toLocaleString()}
                        </span>
                    </div>
                    <div class="plan-details-grid">
                        <div>
                            <small>Daily Return</small>
                            <div style="font-weight: bold;">${plan.dailyReturnPercent}%</div>
                        </div>
                        <div>
                            <small>Duration</small>
                            <div style="font-weight: bold;">${plan.durationDays} Days</div>
                        </div>
                        <div>
                            <small>Total Return</small>
                            <div style="font-weight: bold;">${plan.totalReturnPercent}%</div>
                        </div>
                    </div>
                    <div class="table-actions" style="margin-top: 15px;">
                        <button class="btn btn-sm btn-secondary" onclick="admin.editPlan('${plan.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm ${plan.isActive ? 'btn-warning' : 'btn-success'}" 
                                onclick="admin.togglePlanStatus('${plan.id}', ${!plan.isActive})">
                            ${plan.isActive ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}
                            ${plan.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="admin.deletePlan('${plan.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    async openPlanEditor(planId = null) {
        const isEdit = !!planId;
        let planData = null;
        
        if (isEdit) {
            const planDoc = await firebase.firestore().collection('investmentPlans').doc(planId).get();
            planData = planDoc.data();
        }
        
        const content = `
            <form id="planForm">
                <input type="hidden" id="planId" value="${planId || ''}">
                
                <div class="form-group">
                    <label class="form-label">Plan Name</label>
                    <input type="text" id="planName" class="form-control" 
                           value="${planData?.name || ''}" required>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Investment Amount (₹)</label>
                        <input type="number" id="planAmount" class="form-control" 
                               value="${planData?.minAmount || ''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Plan Duration (Days)</label>
                        <input type="number" id="planDuration" class="form-control" 
                               value="${planData?.durationDays || ''}" required min="1">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Daily Return (%)</label>
                        <input type="number" id="planDailyReturn" class="form-control" 
                               value="${planData?.dailyReturnPercent || ''}" required step="0.1" min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Total Return (%)</label>
                        <input type="number" id="planTotalReturn" class="form-control" 
                               value="${planData?.totalReturnPercent || ''}" readonly>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Plan Image</label>
                    <input type="file" id="planImage" accept="image/*" class="form-control">
                    ${planData?.imageUrl ? `
                        <div style="margin-top: 10px;">
                            <img src="${planData.imageUrl}" alt="Current Image" style="max-width: 200px; border-radius: 8px;">
                        </div>
                    ` : ''}
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="planIsVIP" ${planData?.isVIP ? 'checked' : ''}>
                        VIP Plan (Special benefits)
                    </label>
                </div>
                
                <div class="form-group">
                    <label class="form-label">
                        <input type="checkbox" id="planIsActive" ${planData?.isActive !== false ? 'checked' : ''}>
                        Active (Visible to users)
                    </label>
                </div>
                
                <div class="modal-footer">
                    <button type="submit" class="btn btn-primary">
                        <i class="fas fa-save"></i> ${isEdit ? 'Update Plan' : 'Create Plan'}
                    </button>
                    ${isEdit ? `
                        <button type="button" class="btn btn-danger" onclick="admin.deletePlan('${planId}')">
                            <i class="fas fa-trash"></i> Delete Plan
                        </button>
                    ` : ''}
                    <button type="button" class="btn btn-secondary" data-modal="planEditorModal">
                        Cancel
                    </button>
                </div>
            </form>
        `;
        
        document.getElementById('planEditorContent').innerHTML = content;
        this.openModal('planEditorModal');
        
        // Calculate total return automatically
        document.getElementById('planDailyReturn').addEventListener('input', this.calculateTotalReturn);
        document.getElementById('planDuration').addEventListener('input', this.calculateTotalReturn);
        
        // Form submission
        document.getElementById('planForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.savePlan();
        });
    }
    
    calculateTotalReturn() {
        const daily = parseFloat(document.getElementById('planDailyReturn').value) || 0;
        const duration = parseFloat(document.getElementById('planDuration').value) || 0;
        const total = daily * duration;
        document.getElementById('planTotalReturn').value = total.toFixed(2);
    }
    
    async savePlan() {
        const planId = document.getElementById('planId').value;
        const isEdit = !!planId;
        
        const planData = {
            name: document.getElementById('planName').value,
            minAmount: parseFloat(document.getElementById('planAmount').value),
            durationDays: parseInt(document.getElementById('planDuration').value),
            dailyReturnPercent: parseFloat(document.getElementById('planDailyReturn').value),
            totalReturnPercent: parseFloat(document.getElementById('planTotalReturn').value),
            isVIP: document.getElementById('planIsVIP').checked,
            isActive: document.getElementById('planIsActive').checked,
            updatedAt: new Date().toISOString()
        };
        
        // Handle image upload
        const imageFile = document.getElementById('planImage').files[0];
        if (imageFile) {
            try {
                const storageRef = firebase.storage().ref();
                const imageRef = storageRef.child(`plan-images/${Date.now()}_${imageFile.name}`);
                await imageRef.put(imageFile);
                planData.imageUrl = await imageRef.getDownloadURL();
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        }
        
        try {
            if (isEdit) {
                await firebase.firestore().collection('investmentPlans').doc(planId).update(planData);
                await adminSecurity.logAdminAction('UPDATE_PLAN', { planId, ...planData });
                alert('Plan updated successfully!');
            } else {
                planData.createdAt = new Date().toISOString();
                await firebase.firestore().collection('investmentPlans').add(planData);
                await adminSecurity.logAdminAction('CREATE_PLAN', planData);
                alert('Plan created successfully!');
            }
            
            this.closeModal('planEditorModal');
            this.loadPlans();
        } catch (error) {
            alert('Error saving plan: ' + error.message);
        }
    }
    
    async togglePlanStatus(planId, newStatus) {
        const action = newStatus ? 'activate' : 'deactivate';
        if (!confirm(`Are you sure you want to ${action} this plan?`)) return;
        
        try {
            await firebase.firestore().collection('investmentPlans').doc(planId).update({
                isActive: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            await adminSecurity.logAdminAction(
                newStatus ? 'ACTIVATE_PLAN' : 'DEACTIVATE_PLAN', 
                { planId }
            );
            
            alert(`Plan ${action}d successfully!`);
            this.loadPlans();
        } catch (error) {
            alert(`Error ${action}ing plan: ${error.message}`);
        }
    }
    
    async deletePlan(planId) {
        if (!confirm('WARNING: This will permanently delete the plan. This action cannot be undone.')) return;
        
        try {
            await firebase.firestore().collection('investmentPlans').doc(planId).delete();
            await adminSecurity.logAdminAction('DELETE_PLAN', { planId });
            alert('Plan deleted successfully!');
            this.closeModal('planEditorModal');
            this.loadPlans();
        } catch (error) {
            alert('Error deleting plan: ' + error.message);
        }
    }
    
    // ========== SYSTEM SETTINGS ==========
    async loadSystemSettings() {
        try {
            const settingsDoc = await firebase.firestore()
                .collection('systemSettings')
                .doc('config')
                .get();
            
            if (settingsDoc.exists) {
                this.systemSettings = settingsDoc.data();
                this.populateSettingsForm();
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }
    
    populateSettingsForm() {
        const settings = this.systemSettings;
        
        // General settings
        if (document.getElementById('appName')) 
            document.getElementById('appName').value = settings.appName || '';
        if (document.getElementById('supportEmail')) 
            document.getElementById('supportEmail').value = settings.supportEmail || '';
        if (document.getElementById('supportPhone')) 
            document.getElementById('supportPhone').value = settings.supportPhone || '';
        if (document.getElementById('maintenanceMode')) 
            document.getElementById('maintenanceMode').value = settings.maintenanceMode || 'false';
        
        // Commission settings
        if (document.getElementById('commission1')) 
            document.getElementById('commission1').value = settings.commission1 || 21;
        if (document.getElementById('commission2')) 
            document.getElementById('commission2').value = settings.commission2 || 3;
        if (document.getElementById('commission3')) 
            document.getElementById('commission3').value = settings.commission3 || 1;
        if (document.getElementById('directBonus')) 
            document.getElementById('directBonus').value = settings.directBonus || 50;
        
        // Limit settings
        if (document.getElementById('minDeposit')) 
            document.getElementById('minDeposit').value = settings.minDeposit || 100;
        if (document.getElementById('maxDeposit')) 
            document.getElementById('maxDeposit').value = settings.maxDeposit || 50000;
        if (document.getElementById('minWithdrawal')) 
            document.getElementById('minWithdrawal').value = settings.minWithdrawal || 100;
        if (document.getElementById('maxWithdrawal')) 
            document.getElementById('maxWithdrawal').value = settings.maxWithdrawal || 50000;
        if (document.getElementById('dailyWithdrawalLimit')) 
            document.getElementById('dailyWithdrawalLimit').value = settings.dailyWithdrawalLimit || 200000;
        if (document.getElementById('tdsPercentage')) 
            document.getElementById('tdsPercentage').value = settings.tdsPercentage || 18;
        
        // UPI settings
        if (document.getElementById('primaryUpi')) 
            document.getElementById('primaryUpi').value = settings.primaryUpi || '';
        if (document.getElementById('secondaryUpi')) 
            document.getElementById('secondaryUpi').value = settings.secondaryUpi || '';
        if (document.getElementById('upiName')) 
            document.getElementById('upiName').value = settings.upiName || '';
        
        // Bank settings
        if (document.getElementById('bankName')) 
            document.getElementById('bankName').value = settings.bankName || '';
        if (document.getElementById('bankFullName')) 
            document.getElementById('bankFullName').value = settings.bankFullName || '';
        if (document.getElementById('bankAccount')) 
            document.getElementById('bankAccount').value = settings.bankAccount || '';
        if (document.getElementById('bankIfsc')) 
            document.getElementById('bankIfsc').value = settings.bankIfsc || '';
        if (document.getElementById('bankBranch')) 
            document.getElementById('bankBranch').value = settings.bankBranch || '';
        if (document.getElementById('accountType')) 
            document.getElementById('accountType').value = settings.accountType || 'savings';
    }
    
    async saveSystemSettings() {
        try {
            const settings = {
                // General
                appName: document.getElementById('appName')?.value || '',
                supportEmail: document.getElementById('supportEmail')?.value || '',
                supportPhone: document.getElementById('supportPhone')?.value || '',
                maintenanceMode: document.getElementById('maintenanceMode')?.value || 'false',
                
                // Commissions
                commission1: parseFloat(document.getElementById('commission1')?.value) || 21,
                commission2: parseFloat(document.getElementById('commission2')?.value) || 3,
                commission3: parseFloat(document.getElementById('commission3')?.value) || 1,
                directBonus: parseFloat(document.getElementById('directBonus')?.value) || 50,
                
                // Limits
                minDeposit: parseFloat(document.getElementById('minDeposit')?.value) || 100,
                maxDeposit: parseFloat(document.getElementById('maxDeposit')?.value) || 50000,
                minWithdrawal: parseFloat(document.getElementById('minWithdrawal')?.value) || 100,
                maxWithdrawal: parseFloat(document.getElementById('maxWithdrawal')?.value) || 50000,
                dailyWithdrawalLimit: parseFloat(document.getElementById('dailyWithdrawalLimit')?.value) || 200000,
                tdsPercentage: parseFloat(document.getElementById('tdsPercentage')?.value) || 18,
                
                // UPI
                primaryUpi: document.getElementById('primaryUpi')?.value || '',
                secondaryUpi: document.getElementById('secondaryUpi')?.value || '',
                upiName: document.getElementById('upiName')?.value || '',
                
                // Bank
                bankName: document.getElementById('bankName')?.value || '',
                bankFullName: document.getElementById('bankFullName')?.value || '',
                bankAccount: document.getElementById('bankAccount')?.value || '',
                bankIfsc: document.getElementById('bankIfsc')?.value || '',
                bankBranch: document.getElementById('bankBranch')?.value || '',
                accountType: document.getElementById('accountType')?.value || 'savings',
                
                updatedAt: new Date().toISOString(),
                updatedBy: this.currentUser.email
            };
            
            await firebase.firestore().collection('systemSettings').doc('config').set(settings, { merge: true });
            await adminSecurity.logAdminAction('UPDATE_SETTINGS', settings);
            
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Error saving settings: ' + error.message);
        }
    }
    
    // ========== UTILITY FUNCTIONS ==========
    updateBadges() {
        // Update all badge counts
        document.getElementById('userCountBadge').textContent = this.allUsers.length || 0;
        document.getElementById('paymentCountBadge').textContent = 
            (this.paymentRequests.deposits.length + this.paymentRequests.withdrawals.length) || 0;
    }
    
    updatePaymentCount() {
        const total = this.paymentRequests.deposits.length + this.paymentRequests.withdrawals.length;
        document.getElementById('paymentCountBadge').textContent = total;
    }
    
    updateUserCount() {
        document.getElementById('userCountBadge').textContent = this.allUsers.length;
    }
    
    openModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }
    
    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    async getUserTransactions(userId) {
        try {
            const snapshot = await firebase.firestore()
                .collection('transactions')
                .where('userId', '==', userId)
                .orderBy('timestamp', 'desc')
                .limit(20)
                .get();
            
            return snapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Error loading transactions:', error);
            return [];
        }
    }
    
    formatTransaction(tx) {
        const time = new Date(tx.timestamp).toLocaleString();
        const amountClass = tx.amount > 0 ? 'positive' : 'negative';
        const amountSign = tx.amount > 0 ? '+' : '';
        
        return `
            <div class="transaction-item" style="padding: 10px 0; border-bottom: 1px solid #eee;">
                <div style="display: flex; justify-content: space-between;">
                    <div>
                        <strong>${tx.type}</strong><br>
                        <small>${tx.details || 'No details'}</small><br>
                        <small style="color: #999;">${time}</small>
                    </div>
                    <div style="font-weight: bold; color: ${tx.amount > 0 ? 'green' : 'red'}">
                        ${amountSign}₹${Math.abs(tx.amount).toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });
        
        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        
        // Save settings button
        document.getElementById('saveAllSettings')?.addEventListener('click', () => this.saveSystemSettings());
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.modal;
                if (modalId) this.closeModal(modalId);
            });
        });
        
        // Click outside modal to close
        document.querySelectorAll('.admin-modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        });
        
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabGroup = tab.closest('.admin-tabs');
                const tabId = tab.dataset.tab;
                
                // Update active tab
                tabGroup.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Show corresponding content
                const parent = tabGroup.nextElementSibling || tabGroup.parentElement;
                parent.querySelectorAll('.tab-content').forEach(content => {
                    content.classList.remove('active');
                });
                
                if (tabId) {
                    const content = parent.querySelector(`#${tabId}Tab`) || 
                                  parent.querySelector(`#${tabId}`);
                    if (content) content.classList.add('active');
                }
            });
        });
        
        // Search users
        document.getElementById('searchUsers')?.addEventListener('input', (e) => {
            this.filterUsers(e.target.value);
        });
    }
    
    showSection(sectionId) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === sectionId) {
                item.classList.add('active');
            }
        });
        
        // Update section title
        const titles = {
            dashboard: ['Dashboard', 'Monitor system performance'],
            users: ['User Management', 'Manage user accounts and permissions'],
            financial: ['Financial Control', 'Handle transactions and balances'],
            payments: ['Payment Requests', 'Approve deposits and withdrawals'],
            plans: ['Plan Management', 'Create and manage investment plans'],
            settings: ['System Configuration', 'Configure app settings and rules'],
            recharge: ['Recharge Settings', 'Manage payment methods and UPI']
        };
        
        if (titles[sectionId]) {
            document.getElementById('sectionTitle').textContent = titles[sectionId][0];
            document.getElementById('sectionDescription').textContent = titles[sectionId][1];
        }
        
        // Show selected section
        document.querySelectorAll('.section-content').forEach(sec => {
            sec.classList.remove('active-section');
        });
        
        const activeSection = document.getElementById(`${sectionId}Section`);
        if (activeSection) {
            activeSection.classList.add('active-section');
            
            // Load section data
            switch(sectionId) {
                case 'users':
                    this.loadUsers();
                    break;
                case 'payments':
                    this.loadPaymentRequests();
                    break;
                case 'plans':
                    this.loadPlans();
                    break;
                case 'settings':
                case 'recharge':
                    this.loadSystemSettings();
                    break;
            }
        }
    }
    
    filterUsers(searchTerm) {
        const rows = document.querySelectorAll('#usersTable tr[data-user-id]');
        const term = searchTerm.toLowerCase();
        
        rows.forEach(row => {
            const email = row.querySelector('.user-email')?.textContent.toLowerCase() || '';
            const phone = row.querySelector('.user-phone')?.textContent.toLowerCase() || '';
            const userId = row.dataset.userId.toLowerCase();
            
            const matches = email.includes(term) || phone.includes(term) || userId.includes(term);
            row.style.display = matches ? '' : 'none';
        });
    }
    
    setupUserRowListeners() {
        // Additional user row event listeners if needed
    }
    
    setupPlanCardListeners() {
        // Additional plan card event listeners if needed
    }
    
    startRealTimeUpdates() {
        // Update dashboard every 30 seconds
        setInterval(() => {
            if (document.querySelector('.active-section').id === 'dashboardSection') {
                this.loadDashboardStats();
            }
        }, 30000);
    }
}

// Initialize admin panel
const admin = new AdminFunctions();
