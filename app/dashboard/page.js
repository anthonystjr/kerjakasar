'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL = {
  pending: 'Menunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [myJobs, setMyJobs] = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('client')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      // Fetch lowongan yang dipost
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, applications(count)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setMyJobs(jobs ?? [])

      // Fetch lamaran yang dikirim
      const { data: apps } = await supabase
        .from('applications')
        .select('*, jobs(judul, lokasi, kategori)')
        .eq('talent_id', session.user.id)
        .order('created_at', { ascending: false })
      setMyApplications(apps ?? [])

      setLoading(false)
    }
    init()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const handleCloseJob = async (jobId) => {
    await supabase.from('jobs').update({ status: 'closed' }).eq('id', jobId)
    setMyJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status: 'closed' } : j))
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-stone-400">Memuat dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl font-black">
                {user?.user_metadata?.full_name?.[0] ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-stone-900">
                {user?.user_metadata?.full_name ?? user?.email}
              </h1>
              <p className="text-stone-400 text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/profile"
              className="px-4 py-2 text-sm border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
            >
              Edit Profil
            </Link>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors cursor-pointer font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('client')}
            className={`px-5 py-2 text-sm rounded-lg font-semibold transition-colors cursor-pointer ${
              tab === 'client' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Lowonganku ({myJobs.length})
          </button>
          <button
            onClick={() => setTab('talent')}
            className={`px-5 py-2 text-sm rounded-lg font-semibold transition-colors cursor-pointer ${
              tab === 'talent' ? 'bg-stone-900 text-white' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            Lamaranku ({myApplications.length})
          </button>
        </div>

        {/* Tab: Client — Lowongan yang dipost */}
        {tab === 'client' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-stone-900">Lowongan yang Kamu Post</h2>
              <Link
                href="/jobs/new"
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors"
              >
                + Post Baru
              </Link>
            </div>
            {myJobs.length === 0 ? (
              <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-stone-500 font-medium mb-1">Belum ada lowongan</p>
                <p className="text-stone-400 text-sm mb-4">Mulai post lowongan untuk menemukan talent</p>
                <Link href="/jobs/new" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors">
                  Post Lowongan Pertama →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myJobs.map((job) => (
                  <div key={job.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                          {job.status === 'open' ? 'Aktif' : 'Ditutup'}
                        </span>
                        <span className="text-xs text-stone-400">
                          {job.applications?.[0]?.count ?? 0} pelamar
                        </span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm truncate">{job.judul}</h3>
                      {job.lokasi && <p className="text-stone-400 text-xs mt-0.5">📍 {job.lokasi}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="px-3 py-1.5 text-xs border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Lihat
                      </Link>
                      {job.status === 'open' && (
                        <button
                          onClick={() => handleCloseJob(job.id)}
                          className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer font-medium"
                        >
                          Tutup
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Talent — Lamaran yang dikirim */}
        {tab === 'talent' && (
          <div>
            <h2 className="font-bold text-stone-900 mb-4">Lamaran yang Kamu Kirim</h2>
            {myApplications.length === 0 ? (
              <div className="text-center py-16 bg-white border border-stone-200 rounded-xl">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-stone-500 font-medium mb-1">Belum ada lamaran</p>
                <p className="text-stone-400 text-sm mb-4">Cari lowongan dan mulai melamar</p>
                <Link href="/jobs" className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors">
                  Cari Lowongan →
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {myApplications.map((app) => (
                  <div key={app.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate">
                        {app.jobs?.judul ?? 'Lowongan tidak tersedia'}
                      </h3>
                      {app.jobs?.lokasi && (
                        <p className="text-stone-400 text-xs mt-0.5">📍 {app.jobs.lokasi}</p>
                      )}
                      <p className="text-stone-500 text-xs mt-1 line-clamp-1 italic">"{app.pesan}"</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[app.status] ?? STATUS_COLOR.pending}`}>
                        {STATUS_LABEL[app.status] ?? app.status}
                      </span>
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="px-3 py-1.5 text-xs border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Lihat
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}