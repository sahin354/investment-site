document.addEventListener('DOMContentLoaded', () => {
    // Check if a user is logged in. Redirect to login page if not.
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log('User is logged in:', user.email);
            initializeApp();
        } else {
            console.log('No user logged in, redirecting...');
            // window.location.href = 'login.html'; 
        }
    });
});

function initializeApp() {
    setupTabs();
    loadInvestmentPlans();
}

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function loadInvestmentPlans() {
    const primaryContainer = document.getElementById('primary');
    const vipContainer = document.getElementById('vip');

    primaryContainer.innerHTML = '<p>Loading plans...</p>';
    vipContainer.innerHTML = '<p>Loading VIP plans...</p>';

    const db = firebase.firestore();

    db.collection("investmentPlans")
      .where("isActive", "==", true)
      .orderBy("minAmount", "asc")
      .onSnapshot((querySnapshot) => {
          primaryContainer.innerHTML = '';
          vipContainer.innerHTML = '';

          if (querySnapshot.empty) {
              primaryContainer.innerHTML = "<p>No investment plans are available at the moment.</p>";
              return;
          }
          
          let primaryPlansExist = false;
          let vipPlansExist = false;

          querySnapshot.forEach((doc) => {
              const plan = doc.data();
              const planId = doc.id;

              // --- UPDATED HTML STRUCTURE ---
              const planCardHTML = `
                  <div class="plan-card ${plan.isVIP ? 'vip' : ''}" data-plan-id="${planId}">
                      <div class="plan-card-header">
                          <h3>${plan.name}</h3>
                          ${plan.isVIP ? '<span class="vip-badge">VIP</span>' : ''}
                      </div>
                      <div class="plan-card-body">
                          <div class="plan-detail">
                              <span class="plan-label">Investment Price</span>
                              <span class="plan-value">₹${plan.minAmount.toLocaleString()}</span>
                          </div>
                          <div class="plan-detail">
                              <span class="plan-label">Daily Income</span>
                              <span class="plan-value">₹${((plan.minAmount * plan.dailyReturnPercent) / 100).toFixed(2)}</span>
                          </div>
                          <div class="plan-detail">
                              <span class="plan-label">Cycle</span>
                              <span class="plan-value">${plan.durationDays} Days</span>
                          </div>
                          <div class="plan-detail">
                              <span class="plan-label">Total Income</span>
                              <span class="plan-value">₹${((plan.minAmount * plan.totalReturnPercent) / 100).toLocaleString()}</span>
                          </div>
                      </div>
                      <div class="plan-card-footer">
                          <button class="buy-button">Buy Now</button>
                      </div>
                  </div>
              `;

              if (plan.isVIP) {
                  vipContainer.innerHTML += planCardHTML;
                  vipPlansExist = true;
              } else {
                  primaryContainer.innerHTML += planCardHTML;
                  primaryPlansExist = true;
              }
          });

          if (!primaryPlansExist) {
              primaryContainer.innerHTML = "<p>No primary plans are available right now.</p>";
          }
          if (!vipPlansExist) {
              vipContainer.innerHTML = "<p>No VIP plans are available right now.</p>";
          }

      }, (error) => {
          console.error("Error getting investment plans: ", error);
          primaryContainer.innerHTML = "<p style='color:red;'>Could not load investment plans.</p>";
          vipContainer.innerHTML = "<p style='color:red;'>Could not load VIP plans.</p>";
      });
      }
