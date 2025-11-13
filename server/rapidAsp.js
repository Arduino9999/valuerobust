// server/rapidAsp.js
const fs = require('fs')
const path = require('path')
const { LRUCache } = require('lru-cache')
const { buildConfig } = require('./config')

const config = buildConfig()

// ---------- logging setup ----------
const logDir = path.join(__dirname, 'logs')
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir)
const logFile = path.join(logDir, 'rapidapi.log')
function appendLog(entry) {
  const time = new Date().toISOString()
  fs.appendFileSync(logFile, `\n[${time}] ${entry}\n`, 'utf8')
}

// ---------- cache (1 year TTL) ----------
const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365
const cache = new LRUCache({ max: 500, ttl: ONE_YEAR_MS })

/**
 * Fetch sold/completed listings via RapidAPI "eBay Average Selling Price"
 * Uses the `/findCompletedItems` POST endpoint (see rapidapi.txt)
 * @param {Object} params
 * @param {string} params.keywords - search keywords
 * @param {number} [params.max_search_results=120] - allowed: 60, 120, 240
 */
async function findSold({ keywords, max_search_results = 120 }) {
  const allowed = [60, 120, 240]
  const maxRes = allowed.includes(Number(max_search_results)) ? Number(max_search_results) : 240

  const key = `sold:${keywords}:${maxRes}`
  if (cache.has(key)) return cache.get(key)

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

  // ----- LOG REQUEST (prompt)
  const safeHeaders = {
    ...headers,
    'x-rapidapi-key': headers['x-rapidapi-key'] ? '***REDACTED***' : ''
  }
  const promptLog = {
    method: 'POST',
    url,
    body: bodyJson,
    headers: safeHeaders
  }
  console.log('[RapidAPI request]', JSON.stringify(promptLog, null, 2))
  appendLog(`REQUEST:\n${JSON.stringify(promptLog, null, 2)}`)

  const t0 = Date.now()
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyJson)
    })
  } catch (netErr) {
    appendLog(`NETWORK ERROR: ${netErr.message}`)
    console.error('RapidAPI network error:', netErr)
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

  // ----- LOG RESPONSE -----
  const respLog = {
    status: resp.status,
    statusText: resp.statusText,
    durationMs,
    body
  }
  console.log('[RapidAPI response]', JSON.stringify(respLog, null, 2))
  appendLog(`RESPONSE:\n${JSON.stringify(respLog, null, 2)}`)

  if (!resp.ok) {
    const err = new Error(
      typeof body === 'object' ? JSON.stringify(body) : String(body)
    )
    throw err
  }

  cache.set(key, body)
  return body
}

module.exports = { findSold }

