module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, headline, education } = req.body;

  if (headline || education) {
    const extractPrompt = `Extract the degree subject from this LinkedIn information. Return ONLY a JSON object: { "degree": "subject name", "level": "BSc/BA/MSc/etc", "confidence": "high/medium/low" }

LinkedIn info: "${headline || ''} ${education || ''}"`;

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
          max_tokens: 200,
          messages: [{ role: 'user', content: extractPrompt }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(b => b.text || '').join('') || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      return res.status(200).json({
        success: true,
        degree: parsed.degree,
        level: parsed.level,
        source: 'linkedin_paste',
      });
    } catch (err) {
      return res.status(500).json({ error: 'Could not parse LinkedIn information' });
    }
  }

  return res.status(200).json({
    success: false,
    message: 'paste_required',
    instructions: 'Please paste your LinkedIn headline or education section below.',
  });
};
