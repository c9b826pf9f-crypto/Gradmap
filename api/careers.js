export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  let body;
  try {
    body = await req.json();
  } catch(e) {
    body = {};
  }

  const degree = body.degree || 'General Graduate';
  const isPreview = body.mode !== 'full';

  let prompt;
  if (isPreview) {
    prompt = 'You are a UK graduate careers expert. For a student with a degree in ' + degree + ', generate exactly 2 career opportunities. Return ONLY valid JSON, no markdown: {"summary":"one sentence about prospects","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Job Title Here","salary":"28000 to 38000","demand":"High","description":"Two sentences about this role.","employers":["UK Employer 1","UK Employer 2","UK Employer 3"],"entryRoute":"Direct application"},{"id":2,"category":"Internship","title":"Internship Title Here","salary":"20000 pro rata","demand":"Competitive","description":"Two sentences about this.","employers":["UK Employer 1","UK Employer 2","UK Employer 3"],"entryRoute":"Apply in autumn"}]}';
  } else {
    prompt = 'You are a UK graduate careers expert. For a ' + degree + ' degree graduate, generate 36 opportunities across: Graduate Careers, Internships, Year Placements, Graduate Schemes, Further Study, Alternative Paths. Return ONLY valid JSON: {"summary":"two sentences","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[{"id":1,"category":"Graduate Careers","title":"role title","salary":"salary range","demand":"High","description":"2 to 3 sentences","employers":["org1","org2","org3"],"entryRoute":"how to apply","timeframe":"when to apply"}]} Generate 36 items total. Use real UK employers. Use accurate 2024 UK salaries. Return ONLY the JSON object.';
  }

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
  const content = data.content || [];
  let text = '';
  for (let i = 0; i < content.length; i++) {
    text += content[i].text || '';
  }
  const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();

  return new Response(clean, {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
