export const config = {
  runtime: "nodejs"
};

export default async function handler(req, res) {
  try {
    const envCheck = {
      PAY0_CREATE_URL: !!process.env.PAY0_CREATE_URL,
      PAY0_USER_TOKEN: !!process.env.PAY0_USER_TOKEN,
      PAY0_REDIRECT_URL: !!process.env.PAY0_REDIRECT_URL
    };

    // 1️⃣ Test raw DNS / HTTPS reachability
    let pingResult = "NOT_STARTED";
    try {
      const ping = await fetch(process.env.PAY0_CREATE_URL, {
        method: "GET"
      });
      pingResult = {
        ok: ping.ok,
        status: ping.status
      };
    } catch (e) {
      pingResult = {
        error: "FETCH_FAILED",
        message: e.message
      };
    }

    // 2️⃣ Test real POST with minimal body
    let postResult = "NOT_STARTED";
    try {
      const post = await fetch(process.env.PAY0_CREATE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.PAY0_USER_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount: 10,
          order_id: "TEST_" + Date.now(),
          customer_mobile: "9999999999",
          redirect_url: process.env.PAY0_REDIRECT_URL
        })
      });

      const text = await post.text();

      postResult = {
        ok: post.ok,
        status: post.status,
        raw: text
      };
    } catch (e) {
      postResult = {
        error: "POST_FETCH_FAILED",
        message: e.message
      };
    }

    return res.status(200).json({
      envCheck,
      pingResult,
      postResult
    });

  } catch (err) {
    return res.status(500).json({
      fatal: true,
      message: err.message
    });
  }
}
