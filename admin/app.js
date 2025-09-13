// --- INVESTMENT PLAN MANAGEMENT ---

function loadInvestmentPlans() {
    const tbody = document.getElementById('plans-tbody');
    if (!tbody) return;

    db.collection('plans').orderBy('investPrice').onSnapshot(snapshot => {
        tbody.innerHTML = ''; // Clear table
        snapshot.forEach(doc => {
            const plan = doc.data();
            const row = `
                <tr>
                    <td>${plan.planName}</td>
                    <td>₹${plan.investPrice}</td>
                    <td>₹${plan.dayIncome}</td>
                    <td>${plan.incomeDays}</td>
                    <td>
                        <button class="delete-btn" data-id="${doc.id}">Delete</button>
                    </td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    });
}

// Handle adding a new plan
const addPlanForm = document.getElementById('addPlanForm');
if (addPlanForm) {
    addPlanForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const planName = addPlanForm.planName.value;
        const investPrice = parseFloat(addPlanForm.investPrice.value);
        const dayIncome = parseFloat(addPlanForm.dayIncome.value);
        const incomeDays = parseInt(addPlanForm.incomeDays.value);

        db.collection('plans').add({
            planName,
            investPrice,
            dayIncome,
            incomeDays
        }).then(() => {
            console.log("Plan added successfully");
            addPlanForm.reset();
        }).catch(error => {
            console.error("Error adding plan: ", error);
        });
    });
}

// Handle deleting a plan (using event delegation)
const plansTable = document.getElementById('plans-table');
if (plansTable) {
    plansTable.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const planId = e.target.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this plan?')) {
                db.collection('plans').doc(planId).delete();
            }
        }
    });
}
