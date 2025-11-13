function okJson(res, obj) { res.status(200).json(obj) }
function errJson(res, code, msg, det) { res.status(code).json({ error: msg, details: det }) }
function toInt(v, f = 0) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : f }
module.exports = { okJson, errJson, toInt }