export const config = { runtime: "edge",
};
export default async function handler(req) { if (req.method 
  !== "POST") {
    return new Response(JSON.stringify({ message: "Method 
    Not Allowed" }), {
      status: 405,
    });
  }
  try { const body = await req.json(); const { order_id } = 
    body; const res = await 
    fetch(`${process.env.PAY0_STATUS_URL}/${order_id}`, {
      method: "GET", headers: { Authorization: `Bearer 
        ${process.env.PAY0_SECRET}`,
      },
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
