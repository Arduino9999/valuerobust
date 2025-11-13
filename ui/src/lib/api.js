const API = import.meta.env.VITE_API_BASE !== undefined ? import.meta.env.VITE_API_BASE : 'http://localhost:4000'

export async function identifyImage(imageBase64) {
  try {
    const r = await fetch(`${API}/api/identify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64 })
    })
    if (!r.ok) {
      const errorText = await r.text()
      throw new Error(`Server error (${r.status}): ${errorText}`)
    }
    return await r.json()
  } catch (err) {
    // Network errors or fetch failures
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to reach server. Check your internet connection.')
    }
    throw err
  }
}

export async function findSold({ keywords, limit = 10 }) {
  try {
    const q = new URLSearchParams({ keywords, limit }).toString()
    const r = await fetch(`${API}/api/sold?${q}`)
    if (!r.ok) {
      const errorText = await r.text()
      throw new Error(`Search error (${r.status}): ${errorText}`)
    }
    return await r.json()
  } catch (err) {
    if (err.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to reach server. Check your internet connection.')
    }
    throw err
  }
}
