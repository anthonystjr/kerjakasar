'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const KATEGORI_LIST = [
  { value: '', label: 'Semua' },
  { value: 'fotografer', label: '📷 Fotografer' },
  { value: 'mc', label: '🎤 MC' },
  { value: 'it', label: '💻 IT' },
  { value: 'event', label: '🎪 Event' },
  { value: 'dekorator', label: '🎨 Dekorator' },
  { value: 'lainnya', label: '🔧 Lainnya' },
]

export default function TalentsPage() {
  const [talents, setTalents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterSkill, setFilterSkill] = useState('')

  const fetchTalents = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('users')
      .select('id, nama, foto_url, bio, skills, created_at')
      .not('nama', 'is', null)
      .order('created_at', { ascending: false })

    if (search.trim()) {
      query = query.ilike('nama', `%${search.trim()}%`)
    }

    const { data } = await query
    let result = data ?? []

    // Filter by skill (client-side — skills is array)
    if (filterSkill) {
      result = result.filter(t =>
        t.skills?.some(s => s.toLowerCase().includes(filterSkill.toLowerCase()))
      )
    }

    setTalents(result)
    setLoading(false)
  }, [search, filterSkill])

  useEffect(() => {
    const t = setTimeout(fetchTalents, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchTalents, search])

  useEffect(() => { fetchTalents() }, [filterSkill])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-3xl font-black text-stone-900 mb-1">Direktori Talent</h1>
          <p className="text-stone-500 text-sm">
            {loading ? 'Memuat...' : `${talents.length} talent terdaftar`}
          </p>
        </div>

        {/* Filter */}
        <div className="bg-white border border-stone-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="🔍 Cari nama talent..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
          />
          <input
            type="text"
            placeholder="💡 Filter skill (cth: editing)"
            value={filterSkill}
            onChange={e => setFilterSkill(e.target.value)}
            className="w-full sm:w-52 px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : talents.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">👥</div>
            <p className="text-stone-500 font-medium">Tidak ada talent ditemukan</p>
            <button
              onClick={() => { setSearch(''); setFilterSkill('') }}
              className="mt-4 px-5 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 cursor-pointer transition-colors font-medium"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {talents.map(talent => (
              <TalentCard key={talent.id} talent={talent} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TalentCard({ talent }) {
  return (
    <Link
      href={`/profile/${talent.id}`}
      className="block bg-white border border-stone-200 rounded-xl p-5 hover:border-orange-300 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        {talent.foto_url ? (
          <img
            src={talent.foto_url}
            alt={talent.nama}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-xl font-black shrink-0">
            {talent.nama?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-900 text-sm group-hover:text-orange-600 transition-colors truncate">
            {talent.nama}
          </h3>
          {talent.bio ? (
            <p className="text-stone-500 text-xs mt-0.5 line-clamp-2 leading-relaxed">{talent.bio}</p>
          ) : (
            <p className="text-stone-300 text-xs mt-0.5 italic">Bio belum diisi</p>
          )}
        </div>
      </div>
      {talent.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {talent.skills.slice(0, 4).map(skill => (
            <span
              key={skill}
              className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100 font-medium"
            >
              {skill}
            </span>
          ))}
          {talent.skills.length > 4 && (
            <span className="text-xs text-stone-400 px-2 py-0.5">+{talent.skills.length - 4}</span>
          )}
        </div>
      )}
    </Link>
  )
}
