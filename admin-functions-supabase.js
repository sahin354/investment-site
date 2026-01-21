// ========================================
// SUPABASE ADMIN PANEL CORE FUNCTIONS
// ========================================

import { supabase } from './supabase.js';
import { adminSecurity, SECURITY_CONFIG } from './admin-security-supabase.js';

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
        const isAuthenticated = await adminSecurity.checkCurrentSession();
        
        if (isAuthenticated) {
            const { data } = await supabase.auth.getUser();
            this.currentUser = data.user;
            this.setupAdminUI(data.user);
            return true;
        } else {
            window.location.href = 'system-control.html';
            return false;
        }
    }
    
    setupAdminUI(user) {
        // Set admin info
        document.getElementById('adminEmail').textContent = user.email;
        document.getElementById('adminName').textContent = 
            user.user_metadata?.full_name || user.email.split('@')[0];
        document.getElementById('adminAvatar').textContent = 
            user.email.charAt(0).toUpperCase();
    }
    
    logout() {
        adminSecurity.logout();
    }
    
    // ========== DASHBOARD ==========
    async loadDashboardStats() {
        try {
            // Total Users
            const { count: userCount, error: userError } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });
            
            if (!userError) {
                document.getElementById('totalUsers').textContent = userCount || 0;
            }
            
            // Total Balance
            const { data: users, error: balanceError } = await supabase
                .from('users')
                .select('balance');
            
            if (!balanceError && users) {
                let totalBalance = 0;
                users.forEach(user => {
                    totalBalance += parseFloat(user.balance || 0);
                });
                document.getElementById('totalBalance').textContent = `₹${totalBalance.toLocaleString()}`;
                
                // Monthly Profit (example calculation)
                const monthlyProfit = totalBalance * 0.05;
                document.getElementById('monthlyProfit').textContent = `₹${monthlyProfit.toLocaleString()}`;
            }
            
            // Active Users (last 24 hours)
            const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const { data: activities, error: activityError } = await supabase
                .from('user_activity')
                .select('user_id')
                .gte('timestamp', yesterday.toISOString());
            
            if (!activityError && activities) {
                const activeUsers = new Set(activities.map(a => a.user_id));
                document.getElementById('activeUsers').textContent = activeUsers.size;
            }
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
        }
    }
    
    async loadRecentActivity() {
        try {
            const { data, error } = await supabase
                .from('security_logs')
                .select('*')
                .order('timestamp', { ascending: false })
                .limit(20);
            
            if (error) throw error;
            
            const tbody = document.getElementById('activityTable');
            tbody.innerHTML = '';
            
            if (!data || data.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 40px;">
                            No recent activity
                        </td>
                    </tr>
                `;
                return;
            }
            
            data.forEach(log => {
                const time = new Date(log.timestamp).toLocaleString();
                const row = `
                    <tr>
                        <td>${time}</td>
                        <td>${log.email || log.admin_email || 'System'}</td>
                        <td>
                            <span class="badge ${this.getEventBadgeClass(log.event)}">
                                ${log.event}
                            </span>
                        </td>
                        <td>${log.details || log.reason || 'No details'}</td>
                        <td>${log.user_agent ? `<small>${log.user_agent.substring(0, 50)}...</small>` : 'Unknown'}</td>
                    </tr>
                `;
                tbody.innerHTML += row;
            });
            
        } catch (error) {
            console.error('Error loading activity:', error);
        }
    }
    
    // ========== USER MANAGEMENT ==========
    async loadUsers() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.allUsers = data || [];
            const tbody = document.getElementById('usersTable');
            tbody.innerHTML = '';
            
            if (this.allUsers.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="8" style="text-align: center; padding: 40px;">
                            No users found
                        </td>
                    </tr>
                `;
                return;
            }
            
            this.allUsers.forEach(user => {
                const row = this.createUserRow(user);
                tbody.innerHTML += row;
            });
            
            this.updateUserCount();
            
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }
    
    createUserRow(user) {
        const joinDate = user.created_at ? 
            new Date(user.created_at).toLocaleDateString() : 'N/A';
        
        const statusClass = user.is_blocked ? 'badge-danger' : 'badge-success';
        const statusText = user.is_blocked ? 'Blocked' : 'Active';
        
        const bankInfo = user.bank_real_name ? 
            `${user.bank_real_name.substring(0, 15)}...` : 'Not Set';
        
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
                        <button class="btn btn-sm btn-danger" onclick="admin.toggleUserBlock('${user.id}', ${!user.is_blocked})">
                            ${user.is_blocked ? '<i class="fas fa-unlock"></i>' : '<i class="fas fa-ban"></i>'}
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }
    
    async viewUserDetails(userId) {
        try {
            // Get user data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (userError) throw userError;
            
            // Get transactions
            const { data: transactions, error: txError } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);
            
            if (txError) console.error('Error loading transactions:', txError);
            
            const content = `
                <div class="user-details-grid">
                    <div><strong>User ID:</strong> ${userId}</div>
                    <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                    <div><strong>Phone:</strong> ${user.phone || 'N/A'}</div>
                    <div><strong>Balance:</strong> ₹${(user.balance || 0).toFixed(2)}</div>
                    <div><strong>Status:</strong> ${user.is_blocked ? 'Blocked' : 'Active'}</div>
                    <div><strong>Joined:</strong> ${user.created_at ? 
                        new Date(user.created_at).toLocaleString() : 'N/A'}</div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4><i class="fas fa-university"></i> Bank Details</h4>
                    <div class="user-details-grid">
                        <div><strong>Account Name:</strong> ${user.bank_real_name || 'Not Set'}</div>
                        <div><strong>Account Number:</strong> ${user.bank_account || 'Not Set'}</div>
                        <div><strong>Bank Name:</strong> ${user.bank_name || 'Not Set'}</div>
                        <div><strong>IFSC Code:</strong> ${user.bank_ifsc || 'Not Set'}</div>
                        <div><strong>UPI ID:</strong> ${user.bank_upi || 'Not Set'}</div>
                        <div><strong>Verified:</strong> ${user.bank_verified ? 'Yes' : 'No'}</div>
                    </div>
                </div>
                
                <div style="margin-top: 20px;">
                    <h4><i class="fas fa-history"></i> Recent Transactions</h4>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${transactions && transactions.length > 0 ? 
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
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            
            const content = `
                <form id="editBankForm">
                    <div class="form-grid">
                        <div class="form-group">
                            <label class="form-label">Account Holder Name</label>
                            <input type="text" class="form-control" id="editBankName" 
                                   value="${user.bank_real_name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Bank Name</label>
                            <input type="text" class="form-control" id="editBankFullName" 
                                   value="${user.bank_name || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Account Number</label>
                            <input type="text" class="form-control" id="editAccountNumber" 
                                   value="${user.bank_account || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">IFSC Code</label>
                            <input type="text" class="form-control" id="editIfscCode" 
                                   value="${user.bank_ifsc || ''}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">UPI ID</label>
                            <input type="text" class="form-control" id="editUpiId" 
                                   value="${user.bank_upi || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Verification Status</label>
                            <select class="form-control" id="editBankVerified">
                                <option value="true" ${user.bank_verified ? 'selected' : ''}>Verified</option>
                                <option value="false" ${!user.bank_verified ? 'selected' : ''}>Not Verified</option>
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
                    bank_real_name: document.getElementById('editBankName').value,
                    bank_name: document.getElementById('editBankFullName').value,
                    bank_account: document.getElementById('editAccountNumber').value,
                    bank_ifsc: document.getElementById('editIfscCode').value,
                    bank_upi: document.getElementById('editUpiId').value,
                    bank_verified: document.getElementById('editBankVerified').value === 'true',
                    bank_updated_at: new Date().toISOString()
                };
                
                try {
                    const { error } = await supabase
                        .from('users')
                        .update(bankData)
                        .eq('id', userId);
                    
                    if (error) throw error;
                    
                    await adminSecurity.logAdminAction('UPDATE_USER_BANK', { userId, ...bankData });
                    alert('Bank details updated successfully!');
                    this.closeModal('userDetailsModal');
                    this.loadUsers();
                } catch (error) {
                    alert('Error updating bank details: ' + error.message);
                }
            });
            
        } catch (error) {
            console.error('Error loading user:', error);
            alert('Error loading user data');
        }
    }
    
    async toggleUserBlock(userId, shouldBlock) {
        const action = shouldBlock ? 'block' : 'unblock';
        const confirmMsg = shouldBlock ? 
            'Are you sure you want to block this user?' :
            'Are you sure you want to unblock this user?';
        
        if (!confirm(confirmMsg)) return;
        
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    is_blocked: shouldBlock,
                    blocked_at: shouldBlock ? new Date().toISOString() : null,
                    blocked_by: this.currentUser.email
                })
                .eq('id', userId);
            
            if (error) throw error;
            
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
    
    // ========== FINANCIAL CONTROL ==========
    async executeTransaction(userId, type, amount, reason) {
        try {
            // Get current balance
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('balance')
                .eq('id', userId)
                .single();
            
            if (userError) throw userError;
            
            let newBalance = parseFloat(user.balance || 0);
            let txAmount = parseFloat(amount);
            
            // Calculate new balance
            switch(type) {
                case 'add':
                    newBalance += txAmount;
                    break;
                case 'subtract':
                    newBalance -= txAmount;
                    if (newBalance < 0) throw new Error('Balance cannot be negative');
                    break;
                case 'set':
                    newBalance = txAmount;
                    break;
                default:
                    throw new Error('Invalid transaction type');
            }
            
            // Update user balance
            const { error: updateError } = await supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', userId);
            
            if (updateError) throw updateError;
            
            // Record transaction
            const { error: txError } = await supabase
                .from('transactions')
                .insert([{
                    user_id: userId,
                    type: type,
                    amount: type === 'subtract' ? -txAmount : txAmount,
                    details: reason,
                    status: 'completed',
                    created_at: new Date().toISOString()
                }]);
            
            if (txError) throw txError;
            
            await adminSecurity.logAdminAction('EXECUTE_TRANSACTION', {
                userId,
                type,
                amount,
                reason
            });
            
            return { success: true, newBalance };
            
        } catch (error) {
            console.error('Transaction error:', error);
            throw error;
        }
    }
    
    // ========== PAYMENT MANAGEMENT ==========
    async loadPaymentRequests() {
        try {
            // Load deposit requests
            const { data: deposits, error: depositError } = await supabase
                .from('deposit_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (depositError) throw depositError;
            
            this.paymentRequests.deposits = deposits || [];
            this.renderDepositRequests();
            
            // Load withdrawal requests
            const { data: withdrawals, error: withdrawalError } = await supabase
                .from('withdrawal_requests')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });
            
            if (withdrawalError) throw withdrawalError;
            
            this.paymentRequests.withdrawals = withdrawals || [];
            this.renderWithdrawalRequests();
            
            this.updatePaymentCount();
            
        } catch (error) {
            console.error('Error loading payment requests:', error);
        }
    }
    
    renderDepositRequests() {
        const tbody = document.getElementById('depositRequests');
        tbody.innerHTML = '';
        
        document.getElementById('depositCount').textContent = this.paymentRequests.deposits.length;
        
        this.paymentRequests.deposits.forEach(request => {
            const time = new Date(request.created_at).toLocaleString();
            const screenshot = request.screenshot_url ? 
                `<a href="${request.screenshot_url}" target="_blank" class="btn btn-sm btn-secondary">
                    <i class="fas fa-image"></i> View
                </a>` : 'No Screenshot';
            
            const row = `
                <tr data-deposit-id="${request.id}">
                    <td>${time}</td>
                    <td>${request.user_email || 'N/A'}</td>
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
            tbody.innerHTML += row;
        });
    }
    
    renderWithdrawalRequests() {
        const tbody = document.getElementById('withdrawalRequests');
        tbody.innerHTML = '';
        
        document.getElementById('withdrawalCount').textContent = this.paymentRequests.withdrawals.length;
        
        this.paymentRequests.withdrawals.forEach(request => {
            const tds = request.amount * 0.18; // 18% TDS
            const payout = request.amount - tds;
            
            const row = `
                <tr data-withdrawal-id="${request.id}">
                    <td>${new Date(request.created_at).toLocaleDateString()}</td>
                    <td>${request.user_email || 'N/A'}</td>
                    <td><strong>₹${request.amount || 0}</strong></td>
                    <td>₹${tds.toFixed(2)}</td>
                    <td><strong>₹${payout.toFixed(2)}</strong></td>
                    <td>
                        ${request.bank_name || 'N/A'}<br>
                        <small>A/C: ${request.bank_account || 'N/A'}</small>
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
            tbody.innerHTML += row;
        });
    }
    
    async processPayment(type, requestId, action) {
        try {
            const tableName = type === 'deposit' ? 'deposit_requests' : 'withdrawal_requests';
            
            // Get request details
            const { data: request, error: fetchError } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', requestId)
                .single();
            
            if (fetchError) throw fetchError;
            
            if (action === 'approve') {
                if (!confirm(`Are you sure you want to approve this ${type} of ₹${request.amount}?`)) {
                    return;
                }
                
                const utr = prompt(`Enter UTR/Transaction ID for this ${type}:`);
                if (!utr) return;
                
                // Update request status
                const { error: updateError } = await supabase
                    .from(tableName)
                    .update({
                        status: 'approved',
                        processed_at: new Date().toISOString(),
                        processed_by: this.currentUser.email,
                        utr: utr
                    })
                    .eq('id', requestId);
                
                if (updateError) throw updateError;
                
                // Update user balance
                const userUpdate = type === 'withdrawal' ? 
                    { balance: request.current_balance - request.amount } :
                    { balance: request.current_balance + request.amount };
                
                const { error: userError } = await supabase
                    .from('users')
                    .update(userUpdate)
                    .eq('id', request.user_id);
                
                if (userError) throw userError;
                
                // Record transaction
                const { error: txError } = await supabase
                    .from('transactions')
                    .insert([{
                        user_id: request.user_id,
                        type: type,
                        amount: type === 'withdrawal' ? -request.amount : request.amount,
                        status: 'completed',
                        utr: utr,
                        created_at: new Date().toISOString()
                    }]);
                
                if (txError) throw txError;
                
                await adminSecurity.logAdminAction(
                    `APPROVE_${type.toUpperCase()}`,
                    { requestId, amount: request.amount, utr }
                );
                
                alert('Payment processed successfully!');
                
            } else if (action === 'reject') {
                const reason = prompt('Enter reason for rejection:');
                if (!reason) return;
                
                const { error } = await supabase
                    .from(tableName)
                    .update({
                        status: 'rejected',
                        rejected_at: new Date().toISOString(),
                        rejected_by: this.currentUser.email,
                        rejection_reason: reason
                    })
                    .eq('id', requestId);
                
                if (error) throw error;
                
                await adminSecurity.logAdminAction(
                    `REJECT_${type.toUpperCase()}`,
                    { requestId, reason }
                );
                
                alert('Payment request rejected!');
            }
            
            // Reload payment requests
            this.loadPaymentRequests();
            
        } catch (error) {
            alert('Error processing payment: ' + error.message);
        }
    }
    
    // ========== PLAN MANAGEMENT ==========
    async loadPlans() {
        try {
            const { data, error } = await supabase
                .from('investment_plans')
                .select('*')
                .order('is_vip', { ascending: false })
                .order('min_amount', { ascending: true });
            
            if (error) throw error;
            
            this.plans = data || [];
            this.renderPlans();
            
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }
    
    renderPlans() {
        const grid = document.getElementById('plansGrid');
        
        if (this.plans.length === 0) {
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
        this.plans.forEach(plan => {
            plansHTML += this.createPlanCard(plan);
        });
        
        grid.innerHTML = plansHTML;
    }
    
    createPlanCard(plan) {
        const vipBadge = plan.is_vip ? 
            '<span class="badge badge-warning" style="position: absolute; top: 10px; right: 10px;">VIP</span>' : '';
        
        const statusBadge = plan.is_active ? 
            '<span class="badge badge-success">Active</span>' : 
            '<span class="badge badge-danger">Inactive</span>';
        
        const image = plan.image_url ? 
            `<img src="${plan.image_url}" alt="${plan.name}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;">` :
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
                            ₹${plan.min_amount.toLocaleString()}
                        </span>
                    </div>
                    <div class="plan-details-grid">
                        <div>
                            <small>Daily Return</small>
                            <div style="font-weight: bold;">${plan.daily_return_percent}%</div>
                        </div>
                        <div>
                            <small>Duration</small>
                            <div style="font-weight: bold;">${plan.duration_days} Days</div>
                        </div>
                        <div>
                            <small>Total Return</small>
                            <div style="font-weight: bold;">${plan.total_return_percent}%</div>
                        </div>
                    </div>
                    <div class="table-actions" style="margin-top: 15px;">
                        <button class="btn btn-sm btn-secondary" onclick="admin.editPlan('${plan.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm ${plan.is_active ? 'btn-warning' : 'btn-success'}" 
                                onclick="admin.togglePlanStatus('${plan.id}', ${!plan.is_active})">
                            ${plan.is_active ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>'}
                            ${plan.is_active ? 'Deactivate' : 'Activate'}
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
            const { data, error } = await supabase
                .from('investment_plans')
                .select('*')
                .eq('id', planId)
                .single();
            
            if (error) throw error;
            planData = data;
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
                               value="${planData?.min_amount || ''}" required min="0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Plan Duration (Days)</label>
                        <input type="number" id="planDuration" class="form-control" 
                               value="${planData?.duration_days || ''}" required min="1">
                    </div>
                </div>
                
                <div class="form-grid">
                    <div class="form-group">
                        <label class="form-label">Daily Return (%)</label>
                        <input type="number" id="planDailyReturn" class="form-control" 
                               value="${plan
