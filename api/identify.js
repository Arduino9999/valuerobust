const { identifyFromImage } = require('./_lib/gemini')

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { imageBase64, mimeType } = req.body || {}
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 required' })
    }

    const identified = await identifyFromImage({ base64: imageBase64, mimeType })
    res.status(200).json({ success: true, ...identified })
  } catch (err) {
    res.status(500).json({
      error: 'Gemini failed',
      details: { message: err.message }
    })
  }
}
