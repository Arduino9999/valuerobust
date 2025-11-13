// server/gemini.js
const fs = require('fs')
const path = require('path')
const { buildConfig } = require('./config')
const config = buildConfig()

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
const logFile = path.join(logDir, 'gemini.log')

// Helper: append log safely
function appendLog(entry) {
  const time = new Date().toISOString()
  const line = `\n[${time}] ${entry}\n`
  fs.appendFileSync(logFile, line, 'utf8')
}

async function identifyImage(base64Data) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + 
              config.GEMINI_MODEL + ':generateContent?key=' + config.GEMINI_API_KEY

  // Construct the full Gemini prompt
  const geminiPrompt = {
    contents: [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: base64Data } },
          {
            text: `
You are an expert AI assistant helping to identify objects in donation photos.
Provide JSON only with:
{
  "itemName": "string",
  "brand": "string or unknown",
  "model": "string or unknown",
  "keywords": "comma-separated descriptive keywords"
}
Keep it concise and accurate.`
          }
        ]
      }
    ]
  }

  // Log prompt (with truncation to prevent huge file bloat)
  const shortBase64 = base64Data.slice(0, 100) + '...[truncated]'
  const promptLog = JSON.stringify({ ...geminiPrompt, contents: [{ ...geminiPrompt.contents[0], parts: [{ inline_data: '[base64 omitted]' }, geminiPrompt.contents[0].parts[1]] }] }, null, 2)
  console.log('🟢 Gemini prompt:\n', promptLog)
  appendLog(`PROMPT:\n${promptLog}`)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPrompt)
    })

    const data = await resp.json()

    // Log raw Gemini response
    console.log('🔵 Gemini raw response:\n', JSON.stringify(data, null, 2))
    appendLog(`RESPONSE:\n${JSON.stringify(data, null, 2)}`)

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    if (!text.trim()) throw new Error('Empty Gemini response')

    const json = JSON.parse(text)
    return json
  } catch (err) {
    appendLog(`❌ ERROR: ${err.message}`)
    console.error('Gemini identify error:', err)
    throw err
  }
}

module.exports = { identifyImage }
