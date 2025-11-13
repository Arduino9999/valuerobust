import React, { useState, useRef } from 'react'
import { Camera, Loader2, Search, Pencil, ImagePlus, RefreshCw } from 'lucide-react'
import { identifyImage, findSold } from './lib/api'

export default function App() {
  const [image, setImage] = useState(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const [isIdentifying, setIsIdentifying] = useState(false)
  const [identified, setIdentified] = useState(null)

  // NEW: editable query staged between identify -> RapidAPI
  const [query, setQuery] = useState('')
  const [hasStagedQuery, setHasStagedQuery] = useState(false)

  const [isSearching, setIsSearching] = useState(false)
  const [sold, setSold] = useState(null)
  const [error, setError] = useState(null)

  // -------- Camera / Upload ----------
  const startCamera = async () => {
    // On mobile devices, use native camera input instead
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    if (isMobile) {
      cameraInputRef.current?.click()
      return
    }

    // Desktop: use getUserMedia
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error('Camera error:', err)
      alert('Unable to access camera. Use file upload instead.')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  const capturePhoto = () => {
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = canvas.toDataURL('image/jpeg')
    setImage(imageData)
    stopCamera()
    resetAnalysis()
  }

  const handleFileUpload = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      setImage(ev.target.result)
      resetAnalysis()
    }
    r.readAsDataURL(f)
  }

  const resetAnalysis = () => {
    setIdentified(null)
    setQuery('')
    setHasStagedQuery(false)
    setSold(null)
    setError(null)
  }

  const resetAll = () => {
    setImage(null)
    stopCamera()
    resetAnalysis()
  }

  // -------- Identify (Gemini only) ----------
  const runIdentify = async () => {
    if (!image) return
    setIsIdentifying(true)
    setError(null)
    setIdentified(null)
    setSold(null)
    setHasStagedQuery(false)

    try {
      const j = await identifyImage(image) // POST /api/identify
      setIdentified(j)

      // Build a helpful default, but let the user refine it
      const baseBits = []
      if (j.brand && j.brand !== 'unknown') baseBits.push(j.brand)
      if (j.model && j.model !== 'unknown') baseBits.push(j.model)
      if (j.itemName && j.itemName !== 'unknown') baseBits.push(j.itemName)
      // If Gemini returned a "keywords" string, tack it on
      const extras = (j.keywords || '')
        .toString()
        .replace(/\s+/g, ' ')
        .trim()

      const suggested =
        [baseBits.join(' '), extras]
          .filter(Boolean)
          .join(', ')
          .trim() || 'brand model itemName'

      setQuery(suggested)
      setHasStagedQuery(true) // show the interim editor
    } catch (e) {
      console.error('Identify error:', e)
      setError('Failed to identify the item.')
    } finally {
      setIsIdentifying(false)
    }
  }

  // -------- Search Sold (RapidAPI) ----------
  const runSearchSold = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    setError(null)
    setSold(null)
    try {
      const d = await findSold({ keywords: query.trim(), limit: 10 }) // GET /api/sold?limit=10
      setSold(d)
    } catch (e) {
      console.error('Search error:', e)
      setError(typeof e?.message === 'string' ? e.message : 'Search failed.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-rose-50 p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center gap-3">
          <img src="https://fav.farm/cart" alt="cart" className="w-8 h-8" />
          <h1 className="text-3xl font-bold text-amber-800">Value Finder</h1>
        </header>

        {/* Image intake */}
        <section className="bg-white rounded-xl shadow p-5">
          {!image && !isCameraActive && (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={startCamera}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white py-3 hover:bg-blue-700"
              >
                <Camera className="w-5 h-5" />
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-700 text-white py-3 hover:bg-gray-800"
              >
                <ImagePlus className="w-5 h-5" />
                Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          )}

          {isCameraActive && (
            <div className="space-y-3">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
              <div className="flex gap-3">
                <button
                  onClick={capturePhoto}
                  className="flex-1 rounded-lg bg-green-600 text-white py-3 hover:bg-green-700"
                >
                  Capture
                </button>
                <button
                  onClick={stopCamera}
                  className="flex-1 rounded-lg bg-gray-600 text-white py-3 hover:bg-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {image && (
            <div className="space-y-3">
              <img src={image} alt="item" className="w-full max-h-[360px] object-contain rounded-lg border" />
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={runIdentify}
                  disabled={isIdentifying}
                  className="rounded-lg bg-green-600 text-white px-4 py-2 hover:bg-green-700 disabled:opacity-60"
                >
                  {isIdentifying ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Identifying...
                    </span>
                  ) : (
                    'Identify'
                  )}
                </button>
                <button
                  onClick={resetAll}
                  className="rounded-lg bg-gray-200 text-gray-800 px-4 py-2 hover:bg-gray-300 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Identification summary */}
        {identified && (
          <section className="bg-white rounded-xl shadow p-5 space-y-2">
            <h2 className="text-lg font-semibold text-amber-800">Identification</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-amber-50 p-3 rounded">
                <div className="text-gray-500">Item</div>
                <div className="font-medium">{identified.itemName || '—'}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <div className="text-gray-500">Brand</div>
                <div className="font-medium">{identified.brand || '—'}</div>
              </div>
              <div className="bg-amber-50 p-3 rounded">
                <div className="text-gray-500">Model</div>
                <div className="font-medium">{identified.model || '—'}</div>
              </div>
            </div>
          </section>
        )}

        {/* Marketing copy for price tag */}
        {identified && identified.marketingBullets && identified.marketingBullets.length > 0 && (
          <section className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🏷️</span>
              <h2 className="text-xl font-bold text-green-800">Price Tag Copy</h2>
            </div>
            <div className="bg-white rounded-lg p-5 shadow-sm">
              <ul className="space-y-3">
                {identified.marketingBullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-green-600 font-bold text-lg">•</span>
                    <span className="text-gray-800 font-medium leading-relaxed">{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-xs text-green-700 mt-3 italic">
              Copy these bullet points to your price tag to help customers see the value!
            </p>
          </section>
        )}

        {/* NEW: Staging box to refine keywords before RapidAPI */}
        {hasStagedQuery && (
          <section className="bg-white rounded-xl shadow p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-700" />
              <h2 className="text-lg font-semibold text-amber-800">Refine search keywords</h2>
            </div>

            <p className="text-sm text-gray-600">
              Edit before searching sold listings. Tip: include brand, model, synonyms, and common nicknames —
              e.g. "Sony PS-F5, linear tracking, vertical turntable, portable record player".
            </p>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              className="w-full border rounded-lg p-3 font-mono"
              placeholder="brand model, keyword1, keyword2..."
            />

            <div className="flex flex-wrap gap-3">
              <button
                onClick={runSearchSold}
                disabled={isSearching || !query.trim()}
                className="rounded-lg bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Searching sold (10)...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Search eBay Sold (10)
                  </>
                )}
              </button>
              <button
                onClick={() => setQuery((query || '').replace(/\s+/g, ' ').trim())}
                className="rounded-lg bg-gray-200 text-gray-800 px-3 py-2 hover:bg-gray-300"
              >
                Clean whitespace
              </button>
            </div>
          </section>
        )}

        {/* Results */}
        {error && (
          <div className="bg-red-50 text-red-800 border border-red-200 rounded-lg p-3">{error}</div>
        )}

        {sold && (
          <section className="bg-white rounded-xl shadow p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-amber-800">Sold results (showing up to 10)</h2>
              <span className="text-sm text-gray-500">
                Avg: {sold.average_price ?? '—'} | Median: {sold.median_price ?? '—'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-2 pr-3">Title</th>
                    <th className="py-2 pr-3">Price</th>
                    <th className="py-2 pr-3">Condition</th>
                    <th className="py-2 pr-3">Sold Date</th>
                    <th className="py-2 pr-3">Format</th>
                  </tr>
                </thead>
                <tbody>
                  {(sold.products || []).slice(0, 10).map((p) => (
                    <tr key={p.item_id} className="border-b hover:bg-amber-50">
                      <td className="py-2 pr-3">
                        <a href={p.link} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
                          {p.title}
                        </a>
                      </td>
                      <td className="py-2 pr-3">${p.sale_price}</td>
                      <td className="py-2 pr-3">{p.condition}</td>
                      <td className="py-2 pr-3">{p.date_sold}</td>
                      <td className="py-2 pr-3">{p.buying_format}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-500">
              {sold.results} results in page; provider total {sold.total_results}. Data cached up to 1 year.
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
