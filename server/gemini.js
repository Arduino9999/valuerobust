// server/openai.js (formerly gemini.js)
const fs = require('fs');
const path = require('path');
const { buildConfig } = require('./config');
const config = buildConfig();

// --- logging setup ---
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
const logFile = path.join(logDir, 'openai.log');
function appendLog(entry) {
  const time = new Date().toISOString();
  fs.appendFileSync(logFile, `\n[${time}] ${entry}\n`, 'utf8');
}

// --- helpers ---
function stripCodeFences(s = '') {
  return s.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1').replace(/```\s*([\s\S]*?)\s*```/g, '$1').trim();
}
function safeJsonParse(text) {
  const cleaned = stripCodeFences(text);
  try { return JSON.parse(cleaned); }
  catch {
    // very defensive fallback
    return {
      itemName: 'unknown',
      brand: 'unknown',
      model: 'unknown',
      keywords: '',
      marketingBullets: []
    };
  }
}

// Core caller (expects clean base64 only)
async function identifyImage(base64Data, mimeType = 'image/jpeg') {
  const modelName = config.OPENAI_MODEL || 'gpt-4o-mini';
  const url = 'https://api.openai.com/v1/chat/completions';

  const promptText = `
You are an expert AI assistant helping to identify donated items for an op shop (thrift store).

First, identify the item with these details:
- itemName: What is this item?
- brand: Brand name (or "unknown" if not visible)
- model: Model/style name (or "unknown" if not visible)
- keywords: Comma-separated search keywords

Then, create 3-5 short, benefit-driven marketing bullet points for a price tag. These should:
- Highlight key features and benefits
- Be compelling and help sell the item
- Focus on value, quality, condition, or unique features
- Be concise (5-10 words each)
- Use enthusiastic, positive language

Return ONLY valid JSON in this exact shape:
{
  "itemName": "string",
  "brand": "string or unknown",
  "model": "string or unknown",
  "keywords": "comma-separated descriptive keywords",
  "marketingBullets": ["bullet 1", "bullet 2", "bullet 3"]
}

Be accurate and helpful for op shop customers!
  `.trim();

  const body = {
    model: modelName,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${mimeType};base64,${base64Data}`
          }
        },
        {
          type: 'text',
          text: promptText
        }
      ]
    }],
    max_tokens: 1000
  };

  // Log prompt (omit the actual base64)
  const promptForLog = JSON.stringify({
    model: modelName,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: '[base64 omitted]' } },
        { type: 'text', text: promptText }
      ]
    }]
  }, null, 2);
  console.log('[OpenAI prompt]', promptForLog);
  appendLog(`PROMPT:\n${promptForLog}`);

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '');
    appendLog(`❌ HTTP ${resp.status}: ${txt}`);
    throw new Error(`OpenAI HTTP ${resp.status}: ${txt}`);
  }

  const data = await resp.json();
  console.log('[OpenAI raw response]', JSON.stringify(data, null, 2));
  appendLog(`RESPONSE:\n${JSON.stringify(data, null, 2)}`);

  const text = data?.choices?.[0]?.message?.content || '';
  if (!text.trim()) throw new Error('Empty OpenAI response');

  return safeJsonParse(text);
}

// Public API expected by server/index.js
async function identifyFromImage({ base64, mimeType = 'image/jpeg' }) {
  // If a data URL was sent, strip the header
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64;
  return identifyImage(cleaned, mimeType);
}

module.exports = { identifyFromImage, identifyImage };
