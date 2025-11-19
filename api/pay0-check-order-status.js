// api/pay0-check-order-status.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ status: false, message: 'Method not allowed' });
  }

  try {
    const { order_id } = req.body || {};

    if (!order_id) {
      return res.status(400).json({ status: false, message: 'order_id is required' });
    }

    const userToken = process.env.PAY0_USER_TOKEN;
    if (!userToken) {
      return res.status(500).json({ status: false, message: 'PAY0_USER_TOKEN not configured' });
    }

    const params = new URLSearchParams();
    params.append('user_token', userToken);
    params.append('order_id', order_id);

    const pay0Response = await fetch('https://pay0.shop/api/check-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const data = await pay0Response.json();

    return res.status(200).json(data);
  } catch (err) {
    console.error('Pay0 check-order-status error:', err);
    return res.status(500).json({ status: false, message: 'Internal server error' });
  }
}
