'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import JobCard from '@/components/JobCard'
import FilterBar from '@/components/FilterBar'

// Dipisah agar useSearchParams bisa dibungkus Suspense (wajib di Next.js 15+)
function JobsContent() {
  const searchParams = useSearchParams()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [kategori, setKategori] = useState(searchParams.get('kategori') ?? '')
  const [lokasi, setLokasi] = useState('')

  const fetchJobs = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('jobs')
      .select('*, users(nama, foto_url)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (kategori) query = query.eq('kategori', kategori)
    if (lokasi.trim()) query = query.ilike('lokasi', `%${lokasi.trim()}%`)

    const { data, error } = await query

    if (error) console.error('Error fetching jobs:', error)
    setJobs(data ?? [])
    setLoading(false)
  }, [kategori, lokasi])

  // Debounce lokasi search agar tidak nembak API tiap ketik
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchJobs()
    }, lokasi ? 400 : 0)

    return () => clearTimeout(timer)
  }, [fetchJobs, lokasi])

  // Fetch langsung saat kategori berubah (tanpa debounce)
  useEffect(() => {
    fetchJobs()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kategori])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-stone-900 mb-1">Cari Lowongan</h1>
        <p className="text-stone-500 text-sm">
          {loading ? 'Memuat lowongan...' : `${jobs.length} lowongan tersedia`}
        </p>
      </div>

      {/* Filter */}
      <div className="mb-6">
        <FilterBar
          kategori={kategori}
          lokasi={lokasi}
          onKategoriChange={(val) => setKategori(val)}
          onLokasiChange={(val) => setLokasi(val)}
        />
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
              <div className="h-4 bg-stone-100 rounded-full w-1/3 mb-4" />
              <div className="h-5 bg-stone-100 rounded w-3/4 mb-2" />
              <div className="h-4 bg-stone-100 rounded w-full mb-1" />
              <div className="h-4 bg-stone-100 rounded w-2/3 mb-5" />
              <div className="h-4 bg-stone-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-28">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-stone-600 mb-2">
            Tidak ada lowongan ditemukan
          </h3>
          <p className="text-stone-400 text-sm mb-6">Coba ubah filter atau kategori</p>
          <button
            onClick={() => { setKategori(''); setLokasi('') }}
            className="px-5 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 cursor-pointer transition-colors font-medium"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <Suspense
        fallback={
          <div className="max-w-6xl mx-auto px-4 py-10">
            <div className="h-8 bg-stone-200 rounded w-48 mb-8 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse h-40" />
              ))}
            </div>
          </div>
        }
      >
        <JobsContent />
      </Suspense>
    </div>
  )
}
