const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { degree, email } = req.body;
  if (!degree) return res.status(400).json({ error: 'Degree is required' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            unit_amount: 100,
            product_data: {
              name: 'GradMap — Full Career Unlock',
              description: `All careers, internships & graduate schemes for: ${degree}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { degree },
      success_url: `${process.env.FRONTEND_URL}/?success=true&session_id={CHECKOUT_SESSION_ID}&degree=${encodeURIComponent(degree)}`,
      cancel_url: `${process.env.FRONTEND_URL}/?cancelled=true`,
    });

    res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: err.message });
  }
};
