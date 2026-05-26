module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { degree, mode, accessToken } = req.body;
  if (!degree) return res.status(400).json({ error: 'Degree is required' });

  if (mode === 'full') {
    if (!accessToken || accessToken.length < 10) {
      return res.status(401).json({ error: 'Access token required' });
    }
  }

  const isPreview = mode !== 'full';

  const prompt = isPreview
    ? 'You are a UK graduate careers expert. For a student with a degree in "' + degree + '", generate exactly 2 career opportunities. Return ONLY valid JSON, no markdown, no explanation: {"summary":"One sentence about career prospects for this degree","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Specific job title","salary":"£28,000-£38,000","demand":"High","description":"2 sentences about this role and why ' + degree + ' graduates are suited.","employers":["Real UK employer 1","Real UK employer 2","Real UK employer 3"],"entryRoute":"Direct application"},{"id":2,"category":"Internship","title":"Specific internship title","salary":"£18,000-£24,000 pro rata","demand":"Competitive","description":"2 sentences about this internship.","employers":["Real UK employer 1","Real UK employer 2","Real UK employer 3"],"entryRoute":"Apply Oct-Jan"}]}'
    : 'You are a UK graduate careers expert. For a "' + degree + '" degree graduate, generate 36 opportunities. Return ONLY valid JSON: {"summary":"2 sentence overview","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[{"id":1,"category":"Graduate Careers","title":"specific role","salary":"£X,000-£Y,000","demand":"High","description":"2-3 sentences","employers":["Real UK org 1","Real UK org 2","Real UK org 3"],"entryRoute":"how to get in","timeframe":"when to apply"}]} Generate 36 items split across all 6 categories. Real UK employers only. Accurate 2024 UK salaries. Return ONLY the JSON object.';

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
        max_tokens: isPreview ? 1000 : 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    if (!data.content) {
      console.error('No content from API:', JSON.stringify(data));
      return res.status(500).json({ error: 'AI returned no content' });
    }
    const text = data.content.map(b => b.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.status(200).json(parsed);
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};
