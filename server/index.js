require('dotenv').config()
  const express = require('express')
  const cors = require('cors')
  const morgan = require('morgan')
  const rateLimit = require('express-rate-limit')
  const { buildConfig } = require('./config')
  const { findSold } = require('./rapidAsp')
  const { identifyFromImage } = require('./gemini')
  const { okJson, errJson, toInt } = require('./utils')

const config = buildConfig()
const app = express()

app.use(cors({ origin: config.ALLOWED_ORIGIN || '*' }))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))

app.use('/api', rateLimit({ windowMs: 60 * 1000, limit: 60 }))

app.get('/healthz', (_, res) => okJson(res, { ok: true }))

app.post('/api/identify', async (req, res) => {
try {
const { imageBase64, mimeType } = req.body || {}
if (!imageBase64) return errJson(res, 400, 'imageBase64 required')
const identified = await identifyFromImage({ base64: imageBase64, mimeType })
okJson(res, { success: true, ...identified })
} catch (err) {
errJson(res, 500, 'Gemini failed', { message: err.message })
}
})

// server/index.js  (only the /api/sold handler shown; replace that block)
app.get('/api/sold', async (req, res) => {
  try {
    const keywords = (req.query.keywords || '').trim()
    if (!keywords) return errJson(res, 400, 'keywords required')
    const limit = toInt(req.query.limit, 10)

    const result = await findSold({ keywords, max_search_results: 120 })

    okJson(res, {
      success: true,
      ...result,
      products: Array.isArray(result.products) ? result.products.slice(0, limit) : []
    })
  } catch (err) {
    errJson(res, 500, 'RapidAPI failed', {
      message: err.message,
      details: err.details || undefined
    })
  }
})


app.listen(config.PORT, () => console.log(`API on :${config.PORT}`))