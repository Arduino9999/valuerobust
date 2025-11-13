// Serverless-compatible OpenAI module (no file system operations)

function buildConfig() {
  return {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
  }
}

function stripCodeFences(s = '') {
  return s.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1').replace(/```\s*([\s\S]*?)\s*```/g, '$1').trim()
}

function safeJsonParse(text) {
  const cleaned = stripCodeFences(text)
  try { return JSON.parse(cleaned) }
  catch {
    return {
      itemName: 'unknown',
      brand: 'unknown',
      model: 'unknown',
      keywords: '',
      marketingBullets: []
    }
  }
}

async function identifyImage(base64Data, mimeType = 'image/jpeg') {
  const config = buildConfig()
  const modelName = config.OPENAI_MODEL || 'gpt-4o-mini'
  const url = 'https://api.openai.com/v1/chat/completions'

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
  `.trim()

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
  }

  console.log('[OpenAI] Making request to:', modelName)

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  })

  if (!resp.ok) {
    const txt = await resp.text().catch(() => '')
    console.error(`[OpenAI] HTTP ${resp.status}:`, txt)
    throw new Error(`OpenAI HTTP ${resp.status}: ${txt}`)
  }

  const data = await resp.json()
  console.log('[OpenAI] Response received')

  const text = data?.choices?.[0]?.message?.content || ''
  if (!text.trim()) throw new Error('Empty OpenAI response')

  return safeJsonParse(text)
}

async function identifyFromImage({ base64, mimeType = 'image/jpeg' }) {
  const cleaned = base64.includes(',') ? base64.split(',')[1] : base64
  return identifyImage(cleaned, mimeType)
}

module.exports = { identifyFromImage, identifyImage }
