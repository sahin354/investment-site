document.getElementById("rechargeBtn").addEventListener("click", async function () {

    const amount = document.getElementById("amount").value.trim();
    const customer_mobile = localStorage.getItem("mobile");

    if (!amount || amount < 10) {
        alert("Enter a valid amount");
        return;
    }

    try {
        const response = await fetch("/api/pay0CreateOrder", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                amount: amount,
                customer_mobile: customer_mobile
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Server Error");
            return;
        }

        if (data.status === true && data.payment_url) {
            window.location.href = data.payment_url;
        } else {
            alert("Error creating order");
        }

    } catch (error) {
        alert("Server error. Please try again.");
    }
});
