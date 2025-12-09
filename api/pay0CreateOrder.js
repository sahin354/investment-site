export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const { amount, order_id } = body;

    const response = await fetch(process.env.PAY0_CREATE_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PAY0_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        order_id,
        redirect_url: process.env.PAY0_REDIRECT_URL
      })
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: 200 });

  } catch (error) {
    return new Response(JSON.stringify({ error: true, message: error.message }), {
      status: 500
    });
  }
}
