import Link from 'next/link'

const KATEGORI_LABEL = {
  fotografer: '📷 Fotografer',
  mc: '🎤 MC',
  it: '💻 IT',
  event: '🎪 Event',
  dekorator: '🎨 Dekorator',
  lainnya: '🔧 Lainnya',
}

const KATEGORI_COLOR = {
  fotografer: 'bg-blue-100 text-blue-700',
  mc: 'bg-purple-100 text-purple-700',
  it: 'bg-green-100 text-green-700',
  event: 'bg-yellow-100 text-yellow-700',
  dekorator: 'bg-pink-100 text-pink-700',
  lainnya: 'bg-stone-100 text-stone-600',
}

function formatBudget(min, max) {
  const fmt = (n) =>
    new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
  if (min && max) return `Rp ${fmt(min)} – ${fmt(max)}`
  if (min) return `Mulai Rp ${fmt(min)}`
  if (max) return `s/d Rp ${fmt(max)}`
  return 'Negosiasi'
}

export default function JobCard({ job }) {
  const badgeClass = KATEGORI_COLOR[job.kategori] ?? KATEGORI_COLOR.lainnya
  const badgeLabel = KATEGORI_LABEL[job.kategori] ?? job.kategori
  const budget = formatBudget(job.budget_min, job.budget_max)
  const posterName = job.users?.nama ?? 'Anonim'
  const posterPhoto = job.users?.foto_url

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="block bg-white rounded-xl border border-stone-200 hover:border-orange-300 hover:shadow-md transition-all duration-200 p-5 group"
    >
      {/* Top row: badge + durasi */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
          {badgeLabel}
        </span>
        {job.durasi && (
          <span className="text-xs text-stone-400 shrink-0">⏱ {job.durasi}</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-stone-900 text-base leading-snug mb-1.5 group-hover:text-orange-600 transition-colors line-clamp-2">
        {job.judul}
      </h3>

      {/* Description */}
      <p className="text-stone-500 text-sm leading-relaxed line-clamp-2 mb-4">
        {job.deskripsi}
      </p>

      {/* Bottom row: poster + budget/lokasi */}
      <div className="flex items-center justify-between gap-3">
        {/* Poster */}
        <div className="flex items-center gap-2 min-w-0">
          {posterPhoto ? (
            <img
              src={posterPhoto}
              alt={posterName}
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-bold shrink-0">
              {posterName[0]?.toUpperCase() ?? '?'}
            </div>
          )}
          <span className="text-stone-500 text-xs truncate">{posterName}</span>
        </div>

        {/* Budget + Lokasi */}
        <div className="text-right shrink-0">
          <div className="font-bold text-orange-600 text-xs">{budget}</div>
          {job.lokasi && (
            <div className="text-stone-400 text-xs mt-0.5">📍 {job.lokasi}</div>
          )}
        </div>
      </div>
    </Link>
  )
}
