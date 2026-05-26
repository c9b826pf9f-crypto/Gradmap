const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const crypto = require('crypto');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Session ID required' });

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const payload = `${sessionId}:${session.metadata.degree}:${process.env.STRIPE_SECRET_KEY}`;
    const token = crypto.createHash('sha256').update(payload).digest('hex');

    res.status(200).json({
      success: true,
      degree: session.metadata.degree,
      accessToken: token,
      email: session.customer_email,
    });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ error: err.message });
  }
};
