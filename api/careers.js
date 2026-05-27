module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  var degree = (req.body && req.body.degree) || 'General Graduate';
  var isPreview = !req.body || req.body.mode !== 'full';

  var prompt = 'UK careers expert. For ' + degree + ' degree, give 2 opportunities. Return ONLY valid JSON: {"summary":"one sentence","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Job Title","salary":"28000-38000","demand":"High","description":"Two sentences.","employers":["Employer 1","Employer 2","Employer 3"],"entryRoute":"Direct application"}]}';

  if (!isPreview) {
    prompt = 'UK careers expert. For ' + degree + ' degree, give 36 opportunities across Graduate Careers, Internships, Year Placements, Graduate Schemes, Further Study, Alternative Paths. Return ONLY valid JSON: {"summary":"two sentences","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[{"id":1,"category":"Graduate Careers","title":"role","salary":"salary","demand":"High","description":"sentences","employers":["org1","org2","org3"],"entryRoute":"route","timeframe":"timing"}]}';
  }

  try {
    var response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: isPreview ? 1000 : 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    var data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    var text = '';
    var content = data.content || [];
    for (var i = 0; i < content.length; i++) {
      text += content[i].text || '';
    }

text = text.split('\x60\x60\x60json').join('').split('\x60\x60\x60').join('').trim();
  if (!text) {
      return res.status(500).json({ error: 'empty', raw: JSON.stringify(data).substring(0, 500) });
    }

    try {
      var parsed = JSON.parse(text);
      return res.status(200).json(parsed);
    } catch (parseErr) {
      return res.status(500).json({ error: 'parse failed', text: text.substring(0, 500) });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
