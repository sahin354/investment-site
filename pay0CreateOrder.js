module.exports = async function handler(req, res) { if (req.method !== "POST") { return 
    res.status(405).json({ message: "Method Not Allowed" });
  }
  try { const { amount, mobile, order_id } = req.body; const response = await 
    fetch(process.env.PAY0_CREATE_URL, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.PAY0_TOKEN}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ amount, mobile, order_id, redirect_url: 
        process.env.PAY0_REDIRECT_URL,
      })
    });
    const data = await response.json(); return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
};
