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
  try { body = await req.json(); } catch(e) { body = {}; }

  const degree = body.degree || 'General Graduate';
  const isPreview = body.mode !== 'full';

  const previewPrompt = 'UK careers expert. For "' + degree + '" degree, give 2 opportunities. Return ONLY valid JSON with this structure: {"summary":"one sentence","totalOpportunities":62,"opportunities":[{"id":1,"category":"Graduate Career","title":"Job Title"
