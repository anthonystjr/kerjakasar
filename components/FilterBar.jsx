'use client'

const KATEGORI_LIST = [
  { value: '', label: 'Semua' },
  { value: 'fotografer', label: '📷 Fotografer' },
  { value: 'mc', label: '🎤 MC' },
  { value: 'it', label: '💻 IT' },
  { value: 'event', label: '🎪 Event' },
  { value: 'dekorator', label: '🎨 Dekorator' },
  { value: 'lainnya', label: '🔧 Lainnya' },
]

export default function FilterBar({ kategori, lokasi, onKategoriChange, onLokasiChange }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      {/* Kategori buttons */}
      <div className="flex flex-wrap gap-2 flex-1">
        {KATEGORI_LIST.map((k) => (
          <button
            key={k.value}
            onClick={() => onKategoriChange(k.value)}
            className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors cursor-pointer ${
              kategori === k.value
                ? 'bg-orange-500 text-white shadow-sm'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {k.label}
          </button>
        ))}
      </div>

      {/* Lokasi search */}
      <div className="w-full sm:w-52 shrink-0">
        <input
          type="text"
          placeholder="📍 Cari lokasi..."
          value={lokasi}
          onChange={(e) => onLokasiChange(e.target.value)}
          className="w-full px-3 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all placeholder-stone-400"
        />
      </div>
    </div>
  )
}
