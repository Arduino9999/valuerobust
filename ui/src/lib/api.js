const API = import.meta.env.VITE_API_BASE !== undefined ? import.meta.env.VITE_API_BASE : 'http://localhost:4000'

export async function identifyImage(imageBase64) {
  const r = await fetch(`${API}/api/identify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64 })
  })
  if (!r.ok) throw new Error(await r.text())
  return await r.json()
}

export async function findSold({ keywords, limit = 10 }) {
  const q = new URLSearchParams({ keywords, limit }).toString()
  const r = await fetch(`${API}/api/sold?${q}`)
  if (!r.ok) throw new Error(await r.text())
  return await r.json()
}
