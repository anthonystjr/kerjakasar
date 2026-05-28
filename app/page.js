'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import JobCard from '@/components/JobCard'

const KATEGORI_ITEMS = [
  { value: 'fotografer', label: 'Fotografer', icon: '📷', desc: 'Wedding, produk, portrait' },
  { value: 'mc', label: 'MC', icon: '🎤', desc: 'Wedding, seminar, event' },
  { value: 'it', label: 'IT & Programmer', icon: '💻', desc: 'Web, app, jaringan' },
  { value: 'event', label: 'Panitia Event', icon: '🎪', desc: 'Organizer, rundown' },
  { value: 'dekorator', label: 'Dekorator', icon: '🎨', desc: 'Wedding, ulang tahun' },
  { value: 'lainnya', label: 'Lainnya', icon: '🔧', desc: 'Semua jenis kerja' },
]

export default function HomePage() {
  const [latestJobs, setLatestJobs] = useState([])
  const [loadingJobs, setLoadingJobs] = useState(true)

  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('*, users(nama, foto_url)')
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6)

      setLatestJobs(data ?? [])
      setLoadingJobs(false)
    }
    fetchJobs()
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />

      {/* ── Hero ── */}
      <section className="bg-stone-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full mb-6 tracking-widest uppercase">
            Platform Kerja Nonformal
          </div>
          <h1 className="text-4xl sm:text-6xl font-black mb-5 leading-tight">
            Temukan Kerja,{' '}
            <span className="text-orange-400">Tanpa Ribet.</span>
          </h1>
          <p className="text-stone-300 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Hubungkan dirimu dengan klien yang butuh fotografer, MC, programmer,
            dekorator, dan lebih banyak lagi — semuanya gratis.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/jobs"
              className="px-7 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl transition-colors text-base"
            >
              Cari Lowongan →
            </Link>
            <Link
              href="/jobs/new"
              className="px-7 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-base border border-white/20"
            >
              Post Lowongan
            </Link>
          </div>
        </div>
      </section>

      {/* ── Kategori ── */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-black text-stone-900 mb-1">Jelajahi Kategori</h2>
          <p className="text-stone-500 mb-8 text-sm">Temukan pekerjaan sesuai keahlianmu</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {KATEGORI_ITEMS.map((k) => (
              <Link
                key={k.value}
                href={`/jobs?kategori=${k.value}`}
                className="bg-white rounded-xl border border-stone-200 hover:border-orange-300 hover:shadow-md p-4 text-center transition-all group"
              >
                <div className="text-3xl mb-2">{k.icon}</div>
                <div className="font-bold text-stone-900 text-sm group-hover:text-orange-600 transition-colors">
                  {k.label}
                </div>
                <div className="text-stone-400 text-xs mt-1 leading-snug">{k.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Lowongan Terbaru ── */}
      <section className="pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black text-stone-900 mb-1">Lowongan Terbaru</h2>
              <p className="text-stone-500 text-sm">Peluang yang baru saja diposting</p>
            </div>
            <Link
              href="/jobs"
              className="text-orange-500 hover:text-orange-600 font-semibold text-sm transition-colors"
            >
              Lihat Semua →
            </Link>
          </div>

          {loadingJobs ? (
            /* Skeleton */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
                  <div className="h-4 bg-stone-100 rounded-full w-1/3 mb-4" />
                  <div className="h-5 bg-stone-100 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-stone-100 rounded w-full mb-1" />
                  <div className="h-4 bg-stone-100 rounded w-2/3 mb-5" />
                  <div className="h-4 bg-stone-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : latestJobs.length === 0 ? (
            <div className="text-center py-20 text-stone-400">
              <div className="text-5xl mb-3">📋</div>
              <p className="font-medium text-stone-500">Belum ada lowongan.</p>
              <p className="text-sm mt-1">
                <Link href="/jobs/new" className="text-orange-500 hover:underline">
                  Jadilah yang pertama posting!
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {latestJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="bg-orange-500 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">Punya Proyek? Post Sekarang!</h2>
          <p className="text-orange-100 mb-8 text-sm sm:text-base">
            Gratis, cepat, dan langsung terhubung dengan talent terbaik di sekitarmu.
          </p>
          <Link
            href="/jobs/new"
            className="inline-block px-8 py-3.5 bg-white text-orange-600 font-bold rounded-xl hover:bg-orange-50 transition-colors"
          >
            Mulai Posting →
          </Link>
        </div>
      </section>
    </div>
  )
}
