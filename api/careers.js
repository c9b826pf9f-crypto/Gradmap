module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const degree = (req.body && req.body.degree) || 'General Graduate';
  const isPreview = !req.body || req.body.mode !== 'full';

  const prompt = isPreview
    ? 'You are a UK careers expert. For a ' + degree + ' degree, give 2 opportunities. Return ONLY valid JSON: {"summary":"one sentence","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Job Title","salary":"28000 to 38000","demand":"High","description":"Two sentences.","employers":["Employer 1","Employer 2","Employer 3"],"entryRoute":"Direct application"},{"id":2,"category":"Internship","title":"Internship Title","salary":"20000 pro rata","demand":"Competitive","description":"Two sentences.","employers":["Employer 1","Employer 2","Employer 3"],"entryRoute":"Apply in autumn"}]}'
    : 'You are a UK careers expert. For a ' + degree + ' degree, give 36 opportunities across: Graduate Careers, Internships, Year Placements, Graduate Schemes, Further Study, Alternative Paths. Return ONLY valid JSON: {"summary":"two sentences","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[{"id":1,"category":"Graduate Careers","title":"role","salary":"salary","demand":"High","description":"sentences","employers":["org1","org2","org3"],"entryRoute":"route","timeframe":"timing"}]} 36 items total, real UK employers, accurate 2024 salaries.';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: isPreview ? 1000 : 4000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    const content = data.content || [];
    let text = '';
    for (let i = 0; i < content.length; i++) {
      text += content[i].text || '';
    }
    const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (!clean) {
      return res.status(500).json({ error: 'empty', debug: JSON.stringify(data).substring(0, 300) });
    }
    
    const parsed = JSON.parse(clean);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
