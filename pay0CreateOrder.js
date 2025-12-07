export const config = { runtime: "edge",
};
export default async function handler(req) { if (req.method !== 
  "POST") {
    return new Response(JSON.stringify({ message: "Method Not 
    Allowed" }), {
      status: 405,
    });
  }
  try { const body = await req.json(); const { amount, mobile, 
    order_id } = body; if (!process.env.PAY0_CREATE_URL || 
    !process.env.PAY0_TOKEN) {
      return new Response( JSON.stringify({ error: true, message: 
          "Missing PAY0 environment variables",
        }),
        { status: 500 } );
    }
    const res = await fetch(process.env.PAY0_CREATE_URL, { method: 
      "POST", headers: {
        Authorization: `Bearer ${process.env.PAY0_TOKEN}`, 
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ amount, mobile, order_id, redirect_url: 
        process.env.PAY0_REDIRECT_URL,
      }),
    });
    const data = await res.json(); return new 
    Response(JSON.stringify(data), { status: 200 });
  } catch (err) {
    return new Response( JSON.stringify({ error: true, message: 
      err.message }), { status: 500 }
    );
  }
}
