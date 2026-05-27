module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const degree = (req.body && req.body.degree) || 'General Graduate';
  const isPreview = !req.body || req.body.mode !== 'full';
  const prompt = 'UK careers expert. For ' + degree + ' degree, give 2 opportunities. Return ONLY valid JSON: {"summary":"one sentence","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Job Title","salary":"28000-38000","demand":"High","description":"Two sentences.","employers":["Employer 1","Employer 2","Employer 3"],"entryRoute":"Direct application"}]}';

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await r.json();
    if (data.error) return res.status(500).json({ error: data.error.message });
    const text = (data.content || []).map(function(b) { return b.text || ''; }).join('');
const clean = text.split('```json').join('').split('```').join('').trim();
