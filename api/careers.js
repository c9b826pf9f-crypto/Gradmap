// api/careers.js
const crypto = require('crypto');

function verifyToken(accessToken) {
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

  if (mode === 'full') {
    if (!accessToken || !verifyToken(accessToken)) {
      return res.status(401).json({ error: 'Valid access token required', code: 'PAYMENT_REQUIRED' });
    }
  }

  const subject = degree || linkedinData?.headline || 'General Graduate';

  const previewPrompt = `You are a UK graduate careers expert. For a student with a degree in "${subject}", generate 2 career opportunities. Return ONLY valid JSON (no markdown): {"summary":"One engaging sentence about career prospects for this degree","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Specific job title","salary":"£28,000–£38,000","demand":"High","description":"2 sentences about this role and why ${subject} graduates are suited.","employers":["Real UK employer 1","Real UK employer 2","Real UK employer 3"],"entryRoute":"Direct application"},{"id":2,"category":"Internship","title":"Specific internship title","salary":"£18,000–£24,000 pro rata","demand":"Competitive","description":"2 sentences.","employers":["Real UK employer 1","Real UK employer 2","Real UK employer 3"],"entryRoute":"Apply Oct–Jan"}]}`;

  const fullPrompt = `You are a UK graduate careers expert. For a "${subject}" degree graduate, generate ALL opportunities. Return ONLY valid JSON: {"summary":"2 sentence overview","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[]} Each item: {"id":N,"category":"one of 6 above","title":"specific role","salary":"£X–£Y","demand":"High|Medium|Competitive","description":"2-3 sentences specific to ${subject}","employers":["Real UK org 1","Real UK org 2","Real UK org 3","Real UK org 4"],"entryRoute":"how to get in","timeframe":"when to apply"} Generate 36 items: 12 Graduate Careers, 7 Internships, 5 Year Placements, 7 Graduate Schemes, 3 Further Study, 2 Alternative Paths. All employers real UK organisations. Accurate 2024 salaries. Return ONLY JSON.`;

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
