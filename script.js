// Home Page JavaScript
let allPlans = [];
let userInvestments = [];

// Firebase Auth State Management
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Auth persistence set to LOCAL");
        
        // Auth state observer
        firebase.auth().onAuthStateChanged((user) => {
            const currentPage = window.location.pathname.split('/').pop();
            const authPages = ['login.html', 'register.html', 'verify-email.html'];
            
            if (user) {
                // User is signed in
                console.log('User signed in:', user.uid);
                updateUserInfo(user);
                loadInvestmentPlans();
                
                // Redirect away from auth pages if already logged in
                if (authPages.includes(currentPage)) {
                    window.location.href = 'index.html';
                }
            } else {
                // User is signed out
                console.log('User signed out');
                
                // Redirect to login if not on auth pages
                if (!authPages.includes(currentPage)) {
                    window.location.href = 'login.html';
                }
            }
        });
    })
    .catch((error) => {
        console.error('Auth persistence error:', error);
    });

// Update user information in sidebar and profile
function updateUserInfo(user) {
    // Update sidebar
    const sidebarId = document.getElementById('sidebarId');
    const sidebarVIP = document.getElementById('sidebarVIP');
    
    if (sidebarId) {
        sidebarId.innerHTML = `<div class="sidebar-id">ID: ${user.uid.substring(0, 10)}...</div>`;
    }
    if (sidebarVIP) {
        sidebarVIP.innerHTML = '<div class="sidebar-vip">VIP Member</div>';
    }
}

// Sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuBtn = document.getElementById('menuBtn');
    const closeBtn = document.getElementById('closeBtn');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const sideMenu = document.getElementById('sideMenu');

    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            document.body.classList.add('sidebar-open');
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            document.body.classList.remove('sidebar-open');
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            document.body.classList.remove('sidebar-open');
        });
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            
            // Update active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabName).classList.add('active');
            
            // Load specific tab data
            if (tabName === 'purchased') {
                loadUserInvestments();
            }
        });
    });
});

// Investment Plans System
function loadInvestmentPlans() {
    const plansRef = firebase.firestore().collection('investmentPlans');
    
    plansRef.where('isActive', '==', true).get().then((snapshot) => {
        allPlans = [];
        const primarySection = document.getElementById('primary');
        const vipSection = document.getElementById('vip');
        
        primarySection.innerHTML = '<h3>Regular Investment Plans</h3>';
        vipSection.innerHTML = '<h3>🌟 VIP Investment Plans</h3>';
        
        if (snapshot.empty) {
            primarySection.innerHTML += '<p>No investment plans available at the moment.</p>';
            vipSection.innerHTML += '<p>No VIP plans available.</p>';
            return;
        }
        
        snapshot.forEach(doc => {
            const plan = { id: doc.id, ...doc.data() };
            allPlans.push(plan);
            
            const planCard = createPlanCard(plan);
            
            if (plan.isVIP) {
                vipSection.appendChild(planCard);
            } else {
                primarySection.appendChild(planCard);
            }
        });
        
        // Load user's purchased plans
        loadUserInvestments();
    });
}

function createPlanCard(plan) {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
        <div style="padding: 15px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <h4>${plan.name} ${plan.isVIP ? '🌟' : ''}</h4>
                    <p>💰 Investment: ₹${plan.minAmount.toLocaleString()} - ₹${plan.maxAmount.toLocaleString()}</p>
                    <p>📈 Daily Return: ${plan.dailyReturn}%</p>
                    <p>⏰ Duration: ${plan.duration} days</p>
                    <p>🎯 Total Return: ${plan.totalReturn || plan.dailyReturn * plan.duration}%</p>
                    ${plan.description ? `<p>📝 ${plan.description}</p>` : ''}
                </div>
                <div>
                    <button class="buy-btn" onclick="showInvestmentModal('${plan.id}')">
                        Invest Now
                    </button>
                </div>
            </div>
        </div>
    `;
    return card;
}

function showInvestmentModal(planId) {
    const plan = allPlans.find(p => p.id === planId);
    if (!plan) return;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); display: flex; justify-content: center;
        align-items: center; z-index: 1000;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 400px;">
            <h3>Invest in ${plan.name}</h3>
            <p><strong>Daily Return:</strong> ${plan.dailyReturn}%</p>
            <p><strong>Duration:</strong> ${plan.duration} days</p>
            <p><strong>Total Return:</strong> ${plan.totalReturn || plan.dailyReturn * plan.duration}%</p>
            
            <div style="margin: 15px 0;">
                <label><strong>Investment Amount (₹)</strong></label>
                <input type="number" id="investmentAmount" 
                       min="${plan.minAmount}" max="${plan.maxAmount}"
                       value="${plan.minAmount}" 
                       style="width: 100%; padding: 10px; margin: 5px 0; border: 1px solid #ddd; border-radius: 5px;">
                <small>Range: ₹${plan.minAmount.toLocaleString()} - ₹${plan.maxAmount.toLocaleString()}</small>
            </div>
            
            <div id="investmentCalculation" style="background: #f8f9fa; padding: 10px; border-radius: 5px; margin: 10px 0;">
                <p><strong>Daily Income:</strong> ₹<span id="dailyIncomeCalc">0</span></p>
                <p><strong>Total Expected:</strong> ₹<span id="totalExpectedCalc">0</span></p>
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button onclick="this.closest('div').parentElement.remove()" 
                        style="padding: 10px 20px; border: 1px solid #ddd; background: white; border-radius: 5px; flex: 1;">
                    Cancel
                </button>
                <button onclick="processInvestment('${plan.id}')" 
                        style="padding: 10px 20px; background: var(--primary-color); color: white; border: none; border-radius: 5px; flex: 1;">
                    Confirm Investment
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Calculate returns in real-time
    const amountInput = document.getElementById('investmentAmount');
    amountInput.addEventListener('input', function() {
        calculateInvestmentReturns(plan, parseFloat(this.value) || 0);
    });
    
    // Initial calculation
    calculateInvestmentReturns(plan, plan.minAmount);
}

function calculateInvestmentReturns(plan, amount) {
    const dailyIncome = (amount * plan.dailyReturn / 100);
    const totalExpected = amount + (dailyIncome * plan.duration);
    
    document.getElementById('dailyIncomeCalc').textContent = dailyIncome.toFixed(2);
    document.getElementById('totalExpectedCalc').textContent = totalExpected.toFixed(2);
}

function processInvestment(planId) {
    const plan = allPlans.find(p => p.id === planId);
    const amount = parseFloat(document.getElementById('investmentAmount').value);
    const user = firebase.auth().currentUser;
    
    if (!user || !amount) {
        alert('Please enter a valid amount.');
        return;
    }
    
    if (amount < plan.minAmount || amount > plan.maxAmount) {
        alert(`Amount must be between ₹${plan.minAmount.toLocaleString()} and ₹${plan.maxAmount.toLocaleString()}`);
        return;
    }
    
    // Check user balance
    const userRef = firebase.firestore().collection('users').doc(user.uid);
    
    userRef.get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const userBalance = userData.balance || 0;
            
            if (userBalance < amount) {
                alert('Insufficient balance. Please recharge your account.');
                return;
            }
            
            // Process investment
            const dailyIncome = (amount * plan.dailyReturn / 100);
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(startDate.getDate() + plan.duration);
            
            // Create investment record
            const investmentRef = firebase.firestore().collection('userInvestments').doc();
            
            return investmentRef.set({
                userId: user.uid,
                planId: planId,
                planName: plan.name,
                investedAmount: amount,
                dailyReturn: plan.dailyReturn,
                totalDays: plan.duration,
                completedDays: 0,
                dailyIncome: dailyIncome,
                totalEarned: 0,
                expectedTotal: amount + (dailyIncome * plan.duration),
                startDate: startDate,
                endDate: endDate,
                nextPayout: new Date(), // First payout immediately
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                // Deduct amount from user balance
                return userRef.update({
                    balance: firebase.firestore.FieldValue.increment(-amount),
                    totalInvested: firebase.firestore.FieldValue.increment(amount)
                });
            });
        }
    }).then(() => {
        alert('✅ Investment successful! You can track it in Purchased tab.');
        // Close modal
        document.querySelector('div[style*="position: fixed; top: 0"]').remove();
        // Refresh investments
        loadUserInvestments();
    }).catch((error) => {
        console.error('Investment error:', error);
        alert('Investment failed: ' + error.message);
    });
}

function loadUserInvestments() {
    const user = firebase.auth().currentUser;
    if (!user) return;
    
    const investmentsRef = firebase.firestore().collection('userInvestments');
    const purchasedSection = document.getElementById('purchased');
    
    investmentsRef.where('userId', '==', user.uid)
        .orderBy('createdAt', 'desc')
        .onSnapshot((snapshot) => {
            userInvestments = [];
            purchasedSection.innerHTML = '<h3>My Investments</h3>';
            
            if (snapshot.empty) {
                purchasedSection.innerHTML += '<p>No active investments.</p>';
                return;
            }
            
            snapshot.forEach(doc => {
                const investment = { id: doc.id, ...doc.data() };
                userInvestments.push(investment);
                
                const investmentCard = createInvestmentCard(investment);
                purchasedSection.appendChild(investmentCard);
            });
        });
}

function createInvestmentCard(investment) {
    const now = new Date();
    const startDate = investment.startDate.toDate();
    const endDate = investment.endDate.toDate();
    const daysPassed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, investment.totalDays - daysPassed);
    const progress = Math.min(100, (daysPassed / investment.totalDays) * 100);
    
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.innerHTML = `
        <div style="padding: 15px; width: 100%;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <h4>${investment.planName}</h4>
                    <p>💰 Invested: ₹${investment.investedAmount.toLocaleString()}</p>
                    <p>📈 Daily Income: ₹${investment.dailyIncome.toFixed(2)}</p>
                    <p>⏰ Progress: ${daysPassed}/${investment.totalDays} days</p>
                    <p>🎯 Total Earned: ₹${investment.totalEarned.toFixed(2)}</p>
                    <p>⏳ Days Left: ${daysLeft} days</p>
                </div>
                <div style="text-align: right;">
                    <div style="color: ${investment.isActive ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                        ${investment.isActive ? '🟢 Active' : '🔴 Completed'}
                    </div>
                </div>
            </div>
            
            <div style="background: #f0f0f0; border-radius: 10px; height: 8px; margin: 10px 0;">
                <div style="background: var(--primary-color); height: 100%; border-radius: 10px; width: ${progress}%;"></div>
            </div>
            <div style="text-align: center; font-size: 0.9em; color: #666;">
                ${progress.toFixed(1)}% Complete
            </div>
        </div>
    `;
    return card;
        }
