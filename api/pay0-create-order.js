module.exports = async (req, res) => {

    // Allow GET and POST both
    if (req.method !== "GET" && req.method !== "POST") {
        return res.status(405).json({
            status: false,
            message: "Method not allowed"
        });
    }

    // Read amount from GET or POST
    const amount = req.method === "GET" 
        ? req.query.amount 
        : req.body.amount;

    if (!amount || isNaN(amount)) {
        return res.status(400).json({
            status: false,
            message: "Invalid amount"
        });
    }

    // Send user to your manual payment page
    return res.json({
        status: true,
        message: "Order created",
        amount: amount,
        payUPI: "upi://pay?pa=yourupi@bank&pn=InvestSafe&am=" + amount
    });

};
