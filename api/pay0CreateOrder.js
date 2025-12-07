# paste codeexport const config = { runtime: "edge",
CTRL + X then Y + ENTER}; export default async function 
handler(req) { if (req.method
  !== "POST") {
cd ..  return new Response(JSON.stringify({ message: 
    "Method Not Allowed" }), {
git add api/pay0CreateOrder.js status: 405, git commit 
-m "Debug Pay0" });
git push  }
  try { const body = await req.json(); const { amount, 
    mobile, order_id } = body; const res = await 
    fetch(process.env.PAY0_CREATE_URL, {
      method: "POST", headers: { Authorization: `Bearer 
        ${process.env.PAY0_TOKEN}`, "Content-Type": 
        "application/json",
      },
      body: JSON.stringify({ amount, mobile, order_id, 
        redirect_url: process.env.PAY0_REDIRECT_URL,
      }),
    });
    const data = await res.json(); return new 
    Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: true, 
    message: err.message }), {
      status: 500,
    });
  }
}
