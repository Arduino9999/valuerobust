// Serverless-compatible RapidAPI module (no file system operations, no LRU cache)

function buildConfig() {
  return {
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY || '',
    RAPIDAPI_HOST: process.env.RAPIDAPI_HOST || 'ebay-average-selling-price.p.rapidapi.com'
  }
}

async function findSold({ keywords, max_search_results = 120 }) {
  const config = buildConfig()
  const allowed = [60, 120, 240]
  const maxRes = allowed.includes(Number(max_search_results)) ? Number(max_search_results) : 240

  const url = `https://${config.RAPIDAPI_HOST}/findCompletedItems`
  const bodyJson = {
    keywords,
    max_search_results: String(maxRes)
  }
  const headers = {
    'x-rapidapi-key': config.RAPIDAPI_KEY,
    'x-rapidapi-host': config.RAPIDAPI_HOST,
    'Content-Type': 'application/json'
  }

  console.log('[RapidAPI] Searching for:', keywords)

  const t0 = Date.now()
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyJson)
    })
  } catch (netErr) {
    console.error('[RapidAPI] Network error:', netErr)
    throw netErr
  }
  const durationMs = Date.now() - t0

  const text = await resp.text()
  let body
  try {
    body = text ? JSON.parse(text) : {}
  } catch {
    body = { raw: text }
  }

  console.log(`[RapidAPI] Response: ${resp.status} (${durationMs}ms)`)

  if (!resp.ok) {
    const err = new Error(
      typeof body === 'object' ? JSON.stringify(body) : String(body)
    )
    throw err
  }

  return body
}

module.exports = { findSold }
