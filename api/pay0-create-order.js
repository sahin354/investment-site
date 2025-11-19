// api/pay0-create-order.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  try {
    const {
      customer_mobile,
      customer_name,
      amount,
      order_id,
      redirect_url,
      remark1,
      remark2,
    } = req.body || {};

    if (!customer_mobile || !customer_name || !amount || !order_id || !redirect_url) {
      return res.status(400).json({ status: false, message: 'Missing required fields' });
    }

    const userToken = process.env.PAY0_USER_TOKEN;
    if (!userToken) {
      return res.status(500).json({ status: false, message: 'PAY0_USER_TOKEN not configured' });
    }

    // Build form-urlencoded body for Pay0
    const params = new URLSearchParams();
    params.append('customer_mobile', customer_mobile);
    params.append('customer_name', customer_name);
    params.append('user_token', userToken);
    params.append('amount', amount);
    params.append('order_id', order_id);
    params.append('redirect_url', redirect_url);
    if (remark1) params.append('remark1', remark1);
    if (remark2) params.append('remark2', remark2);

    const pay0Response = await fetch('https://pay0.shop/api/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await pay0Response.json();

    // Just forward the response from Pay0
    return res.status(200).json(data);
  } catch (err) {
    console.error('Pay0 create-order error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
