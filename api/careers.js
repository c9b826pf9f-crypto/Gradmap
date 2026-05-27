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

  const { degree, mode } = await req.json();
  const isPreview = mode !== 'full';
  const d = degree || 'General Graduate';

  const prompt = isPreview
    ? 'UK careers expert. For "' + d + '" degree, give 2 opportunities. Return ONLY JSON: {"summary":"one sentence","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Specific Title","salary":"£28,000-£38,000","demand":"High","description":"2 sentences why ' + d + ' graduates suit this role.","employers":["Real UK Employer 1","Real UK Employer 2","Real UK Employer 3"],"entryRoute":"Direct application"},{"id":2,"category":"Internship","title":"Specific Internship","salary":"£20,000 pro rata","demand":"Competitive","description":"2 sentences.","employers":["Real UK Employer 1","Real UK Employer 2","Real UK Employer 3"],"entryRoute":"Apply Sept-Nov"}]}'
    : 'UK careers expert. For "' + d + '" degree, give 36 opportunities. Return ONLY JSON: {"summary":"2 sentences","categories":["Graduate Careers","Internships","Year Placements","Graduate Schemes","Further Study","Alternative Paths"],"opportunities":[{"id":1,"category":"Graduate Careers","title":"role","salary":"£X-£Y","demand":"High","description":"2-3 sentences","employers":["Org1","Org2","Org3"],"entryRoute":"how","timeframe":"when"}]} 36 items across all 6 categories. Real UK employers. 2024 salaries. ONLY JSON.';

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_A
