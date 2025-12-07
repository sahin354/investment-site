module.exports = async function handler(req, res) { if (req.method !== "POST") { return 
    res.status(405).json({ message: "Method Not Allowed" });
  }
  try { const { order_id } = req.body; const response = await 
    fetch(process.env.PAY0_STATUS_URL, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.PAY0_TOKEN}`, 
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ order_id })
    });
    const data = await response.json(); return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: true, message: err.message });
  }
};
