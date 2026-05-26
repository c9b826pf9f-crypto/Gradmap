// api/careers.js
// Calls Anthropic to generate career results
// ?mode=preview  → 2 free results (no auth needed)
// ?mode=full     → all results (requires valid accessToken)

const crypto = require('crypto');

function verifyToken(accessToken, sessionId) {
  // For a real DB, look up the token. Here we do stateless verification.
  // Since we don't store sessionId on full calls, we just check the token is a valid sha256 hex
  // In production, store tokens in Vercel KV with expiry.
  return typeof accessToken === 'string' && accessToken.length === 64;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { degree, linkedinData, mode, accessToken } = req.body;

  if (!degree && !linkedinData) {
    return res.status(400).json({ error: 'Degree or LinkedIn data required' });
  }

  // Full results require payment verification
  if (mode === 'full') {
    if (!accessToken || !verifyToken(accessToken)) {
      return res.status(401).json({ error: 'Valid access token required', code: 'PAYMENT_REQUIRED' });
    }
  }

  const subject = degree || linkedinData?.headline || 'General Graduate';
  const isLinkedIn = !!linkedinData;

  const previewPrompt = `You are a UK graduate careers expert. For a student with a degree in "${subject}", generate 2 career opportunities.

Return ONLY valid JSON (no markdown):
{
  "summary": "One engaging sentence about career prospects for this degree",
  "totalOpportunities": <realistic number 45-85>,
  "opportunities": [
    {
      "id": 1,
      "category": "Graduate Career",
      "title": "Specific job title",
      "salary": "£28,000–£38,000",
      "demand": "High",
      "description": "2 sentences about this role and why ${subject} graduates are suited.",
      "employers": ["Real UK employer 1", "Real UK employer 2", "Real UK employer 3"],
      "entryRoute": "Direct application / Graduate scheme / Further study"
    }
  ]
}

Return exactly 2 opportunities. Make them genuinely relevant and specific to "${subject}". Real UK employers only.`;

  const fullPrompt = `You are a UK graduate careers expert. For a "${subject}" degree graduate, generate a comprehensive opportunities list.

Return ONLY valid JSON (no markdown):
{
  "summary": "Engaging paragraph about career prospects",
  "categories": ["Graduate Careers", "Internships", "Year Placements", "Graduate Schemes", "Further Study", "Freelance & Alternative"],
  "opportunities": [ array ]
}

Each opportunity:
{
  "id": number,
  "category": "one of the 6 categories",
  "title": "specific role or scheme name",
  "salary": "£X,000–£Y,000 (or 'Unpaid' / 'Stipend' for internships)",
  "demand": "High / Medium / Competitive",
  "description": "2–3 sentences. Be specific about how ${subject} skills apply. Mention real skills needed.",
  "employers": ["Real UK org 1","Real UK org 2","Real UK org 3","Real UK org 4"],
  "entryRoute": "How to get in",
  "timeframe": "When to apply e.g. 'Apply Sept–Nov for summer internships'"
}

Generate exactly 42 opportunities:
- 14 Graduate Careers (specific diverse roles)
- 8 Internships (real named programmes where possible)
- 6 Year Placements (real companies that offer them)
- 8 Graduate Schemes (named schemes at real UK companies)
- 4 Further Study options (specific MSc/PhD/professional qualifications)
- 2 Freelance & Alternative paths

All employers must be real, well-known UK organisations. Salary figures must be accurate 2024 UK rates.
Return ONLY the JSON.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: mode === 'full' ? 4000 : 1000,
        messages: [{ role: 'user', content: mode === 'full' ? fullPrompt : previewPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('') || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json(parsed);
  } catch (err) {
    console.error('AI error:', err);
    res.status(500).json({ error: 'Failed to generate results. Please try again.' });
  }
};
