const { findSold } = require('./_lib/rapidAsp')

function toInt(v, f = 0) {
  const n = parseInt(v, 10)
  return Number.isFinite(n) ? n : f
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const keywords = (req.query.keywords || '').trim()
    if (!keywords) {
      return res.status(400).json({ error: 'keywords required' })
    }

    const limit = toInt(req.query.limit, 10)
    const result = await findSold({ keywords, max_search_results: 120 })

    res.status(200).json({
      success: true,
      ...result,
      products: Array.isArray(result.products) ? result.products.slice(0, limit) : []
    })
  } catch (err) {
    res.status(500).json({
      error: 'RapidAPI failed',
      details: {
        message: err.message,
        details: err.details || undefined
      }
    })
  }
}
