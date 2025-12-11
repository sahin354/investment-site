export default function handler(req, res) {
  res.json({
    PAY0_CREATE_URL: process.env.PAY0_CREATE_URL ? "OK" : "MISSING",
    PAY0_USER_TOKEN: process.env.PAY0_USER_TOKEN ? "OK" : "MISSING",
    PAY0_REDIRECT_URL: process.env.PAY0_REDIRECT_URL ? "OK" : "MISSING"
  });
}
