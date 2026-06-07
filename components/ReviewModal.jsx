'use client'
import { useState } from 'react'

export default function ReviewModal({ talent, jobId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [komentar, setKomentar] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (rating === 0) { setError('Pilih rating terlebih dahulu.'); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talent_id: talent.id, job_id: jobId, rating, komentar }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Gagal mengirim ulasan.'); setLoading(false); return }
      onSuccess()
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div className="flex items-center gap-3 mb-5">
          {talent.foto_url ? (
            <img src={talent.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-black">
              {talent.nama?.[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <div>
            <h3 className="font-bold text-stone-900 text-sm">Beri Ulasan</h3>
            <p className="text-stone-500 text-xs">{talent.nama}</p>
          </div>
        </div>

        {/* Stars */}
        <div className="flex gap-2 justify-center mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              className="text-3xl transition-transform hover:scale-110 cursor-pointer"
            >
              <span className={(hovered || rating) >= star ? 'text-amber-400' : 'text-stone-200'}>
                ★
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-xs text-stone-400 mb-4">
          {rating === 1 ? 'Sangat Buruk' : rating === 2 ? 'Buruk' : rating === 3 ? 'Cukup' : rating === 4 ? 'Bagus' : rating === 5 ? 'Sangat Bagus!' : 'Pilih rating'}
        </p>

        <textarea
          value={komentar}
          onChange={e => setKomentar(e.target.value)}
          placeholder="Komentar (opsional)..."
          rows={3}
          className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none mb-3"
        />

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer font-medium"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-lg transition-colors cursor-pointer"
          >
            {loading ? 'Mengirim...' : 'Kirim Ulasan'}
          </button>
        </div>
      </div>
    </div>
  )
}
