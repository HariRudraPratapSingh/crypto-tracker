// api/chat.js — OrbitIQ Serverless Function
// Proxies chatbot requests to OpenRouter API securely.
// Environment variable required: OPENROUTER_API_KEY

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, context } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured', reply: 'OrbitAI is not configured. Please set OPENROUTER_API_KEY.' });
  }

  // System prompt strictly gates AI to dashboard data only
  const systemPrompt = `You are OrbitAI, the intelligent assistant for the OrbitIQ Space Dashboard.
STRICT RULE: You may ONLY answer questions using the dashboard data provided below.
You must NOT use any external knowledge, training data, or assumptions beyond what is given.
If the user asks something not covered by the provided data, respond:
"I can only answer based on current dashboard data. That information isn't available right now."
Keep answers concise, factual, and space-themed.

=== CURRENT DASHBOARD DATA ===
${context || 'No data available yet.'}
=== END OF DASHBOARD DATA ===`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://orbitiq.vercel.app',
        'X-Title': 'OrbitIQ Dashboard',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 300,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ reply: 'OrbitAI is temporarily unavailable. Please try again.' });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || 'No response from AI.';
    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Chat handler error:', err);
    return res.status(500).json({ reply: 'Internal server error. Please try again.' });
  }
}
