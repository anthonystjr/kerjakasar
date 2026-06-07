'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import EscrowPanel from '@/components/EscrowPanel'
import ReviewModal from '@/components/ReviewModal'

const STATUS_COLOR = {
  pending:  'bg-yellow-100 text-yellow-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
}

const STATUS_LABEL = {
  pending:  'Menunggu',
  accepted: 'Diterima',
  rejected: 'Ditolak',
}

export default function DashboardPage() {
  const [user, setUser]                     = useState(null)
  const [profile, setProfile]               = useState(null)
  const [myJobs, setMyJobs]                 = useState([])
  const [myApplications, setMyApplications] = useState([])
  const [applicantsMap, setApplicantsMap]   = useState({})
  const [expandedJob, setExpandedJob]       = useState(null)
  const [loading, setLoading]               = useState(true)
  const [tab, setTab]                       = useState('client')
  const [stats, setStats] = useState({ totalJobs: 0, totalApplicants: 0, totalApplied: 0, totalAccepted: 0 })
  const [reviewTarget, setReviewTarget] = useState(null) // { talent, jobId }

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setUser(session.user)

      // Fix: fetch profil dari tabel users untuk dapat foto_url terbaru
      const { data: profileData } = await supabase
        .from('users')
        .select('id, nama, foto_url, email')
        .eq('id', session.user.id)
        .single()
      setProfile(profileData)

      // Fetch lowongan yang dipost
      const { data: jobs } = await supabase
        .from('jobs')
        .select('*, applications(count)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
      setMyJobs(jobs ?? [])

      // Fetch semua pelamar
      if (jobs?.length) {
        const jobIds = jobs.map(j => j.id)
        const { data: allApps, error: appsError } = await supabase
          .from('applications')
          .select('*, talent:talent_id(id, nama, foto_url, bio, skills), escrow_transactions(id, status, amount, payment_ref, note, funded_at, released_at)')
          .in('job_id', jobIds)
          .order('created_at', { ascending: false })

        if (appsError) console.error('Error fetch applicants:', appsError)
        if (allApps?.[0]) console.log('[debug] sample app escrow:', allApps[0].escrow_transactions)

        const map = {}
        for (const app of allApps ?? []) {
          if (!map[app.job_id]) map[app.job_id] = []
          map[app.job_id].push(app)
        }
        setApplicantsMap(map)
        setStats(prev => ({ ...prev, totalJobs: jobs.length, totalApplicants: (allApps ?? []).length }))
      } else {
        setStats(prev => ({ ...prev, totalJobs: 0, totalApplicants: 0 }))
      }

      // Fetch lamaran yang dikirim sebagai talent
      const { data: apps } = await supabase
        .from('applications')
        .select('*, jobs(id, judul, lokasi, kategori, user_id, budget), escrow_transactions(id, status, amount, payment_ref, note, funded_at, released_at)')
        .eq('talent_id', session.user.id)
        .order('created_at', { ascending: false })
      setMyApplications(apps ?? [])

      const accepted = (apps ?? []).filter(a => a.status === 'accepted').length
      setStats(prev => ({ ...prev, totalApplied: (apps ?? []).length, totalAccepted: accepted }))

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
    setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'closed' } : j))
  }

  const handleUpdateStatus = async (appId, jobId, status) => {
    const { error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId)

    if (error) { console.error('[updateStatus]', error); return }

    if (status === 'accepted') {
      // 1. Update status dulu di state
      setApplicantsMap(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => a.id === appId ? { ...a, status: 'accepted' } : a),
      }))

      // 2. Buat escrow
      const job = myJobs.find(j => j.id === jobId)
      const res = await fetch('/api/escrow/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: appId, amount: job?.budget ?? 0 }),
      })
      const resData = await res.json()

      // 3. Inject escrow ke state langsung — tidak perlu reload dari DB
      setApplicantsMap(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a =>
          a.id === appId
            ? { ...a, status: 'accepted', escrow_transactions: resData.escrow ? [resData.escrow] : [] }
            : a
        ),
      }))
    } else {
      // rejected / status lain
      setApplicantsMap(prev => ({
        ...prev,
        [jobId]: prev[jobId].map(a => a.id === appId ? { ...a, status } : a),
      }))
    }
  }

  // Update escrow di state setelah aksi dari EscrowPanel (tanpa reload DB)
  const handleEscrowUpdate = async (jobId, appId) => {
    const { data: escrow } = await supabase
      .from('escrow_transactions')
      .select('id, status, amount, payment_ref, note, funded_at, released_at')
      .eq('application_id', appId)
      .maybeSingle()

    setApplicantsMap(prev => ({
      ...prev,
      [jobId]: (prev[jobId] ?? []).map(a =>
        a.id === appId
          ? { ...a, escrow_transactions: escrow ? [escrow] : [] }
          : a
      ),
    }))

    // Update sisi talent juga
    setMyApplications(prev => prev.map(a =>
      a.id === appId ? { ...a, escrow_transactions: escrow ? [escrow] : [] } : a
    ))
  }

  // Fix: ambil foto & nama dari profile (tabel users), fallback ke Google metadata
  const displayPhoto = profile?.foto_url || user?.user_metadata?.avatar_url
  const displayName  = profile?.nama || user?.user_metadata?.full_name || user?.email

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <p className="text-stone-400">Memuat dashboard...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      {reviewTarget && (
        <ReviewModal
          talent={reviewTarget.talent}
          jobId={reviewTarget.jobId}
          onClose={() => setReviewTarget(null)}
          onSuccess={() => setReviewTarget(null)}
        />
      )}
      <div className="max-w-4xl mx-auto px-4 py-10">

        {/* Header profil */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {displayPhoto ? (
              <img
                src={`${displayPhoto}?t=${profile?.foto_url ? 'db' : 'google'}`}
                alt=""
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl font-black">
                {displayName?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-stone-900">{displayName}</h1>
              <p className="text-stone-400 text-xs">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/profile" className="px-4 py-2 text-sm border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium">
              Edit Profil
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 transition-colors cursor-pointer font-medium">
              Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Lowongan Dipasang" value={stats.totalJobs}        color="text-indigo-600"  />
          <StatCard label="Total Pelamar"      value={stats.totalApplicants}  color="text-cyan-600"    />
          <StatCard label="Lamaran Dikirim"    value={stats.totalApplied}     color="text-emerald-600" />
          <StatCard label="Lamaran Diterima"   value={stats.totalAccepted}    color="text-orange-500"  />
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

        {/* ── TAB: CLIENT ── */}
        {tab === 'client' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-stone-900">Lowongan yang Kamu Post</h2>
              <Link href="/jobs/new" className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors">
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
                {myJobs.map(job => {
                  const applicants = applicantsMap[job.id] ?? []
                  const isExpanded = expandedJob === job.id

                  return (
                    <div key={job.id} className="bg-white border border-stone-200 rounded-xl overflow-hidden">

                      <div
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-stone-50 transition-colors"
                        onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>
                              {job.status === 'open' ? 'Aktif' : 'Ditutup'}
                            </span>
                            <span className="text-xs text-stone-400">
                              {applicants.length} pelamar
                            </span>
                          </div>
                          <h3 className="font-bold text-stone-900 text-sm truncate">{job.judul}</h3>
                          {job.lokasi && <p className="text-stone-400 text-xs mt-0.5">📍 {job.lokasi}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/jobs/${job.id}`}
                            onClick={e => e.stopPropagation()}
                            className="px-3 py-1.5 text-xs border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                          >
                            Lihat
                          </Link>
                          {job.status === 'open' && (
                            <button
                              onClick={e => { e.stopPropagation(); handleCloseJob(job.id) }}
                              className="px-3 py-1.5 text-xs border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer font-medium"
                            >
                              Tutup
                            </button>
                          )}
                          <span className="text-stone-300 text-xs">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>

                      {/* Daftar pelamar (expand) */}
                      {isExpanded && (
                        <div className="border-t border-stone-100 px-4 pb-4">
                          {applicants.length === 0 ? (
                            <p className="text-stone-400 text-sm text-center py-6">Belum ada pelamar.</p>
                          ) : (
                            <div className="flex flex-col gap-3 mt-4">
                              {applicants.map(app => (
                                <div key={app.id} className="flex flex-col sm:flex-row sm:items-start gap-3 p-3 bg-stone-50 rounded-xl">

                                  <div className="shrink-0">
                                    {app.talent?.foto_url ? (
                                      <img src={app.talent.foto_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-black text-base">
                                        {app.talent?.nama?.[0]?.toUpperCase() ?? '?'}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-stone-900 text-sm">{app.talent?.nama ?? 'Talent'}</p>
                                    <p className="text-stone-500 text-xs italic mt-0.5 line-clamp-2">"{app.pesan}"</p>
                                    {app.talent?.skills?.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {app.talent.skills.slice(0, 4).map(sk => (
                                          <span key={sk} className="text-xs bg-white border border-stone-200 text-stone-500 px-2 py-0.5 rounded-full">
                                            {sk}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex flex-col items-end gap-2 shrink-0">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[app.status] ?? STATUS_COLOR.pending}`}>
                                      {STATUS_LABEL[app.status] ?? app.status}
                                    </span>
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                      {app.status === 'pending' && (
                                        <>
                                          <button
                                            onClick={() => handleUpdateStatus(app.id, job.id, 'accepted')}
                                            className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-lg font-semibold hover:bg-green-200 transition-colors cursor-pointer"
                                          >
                                            Terima
                                          </button>
                                          <button
                                            onClick={() => handleUpdateStatus(app.id, job.id, 'rejected')}
                                            className="px-3 py-1 text-xs bg-red-100 text-red-500 rounded-lg font-semibold hover:bg-red-200 transition-colors cursor-pointer"
                                          >
                                            Tolak
                                          </button>
                                        </>
                                      )}
                                      <Link
                                        href={`/chat?jobId=${job.id}&withUser=${app.talent_id}`}
                                        className="px-3 py-1 text-xs bg-indigo-100 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-200 transition-colors"
                                      >
                                        💬 Chat
                                      </Link>
                                      {app.status === 'accepted' && (
                                        <button
                                          onClick={() => setReviewTarget({ talent: app.talent, jobId: job.id })}
                                          className="px-3 py-1 text-xs bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition-colors cursor-pointer"
                                        >
                                          ⭐ Ulasan
                                        </button>
                                      )}
                                      <Link
                                        href={`/profile/${app.talent_id}`}
                                        className="px-3 py-1 text-xs border border-stone-200 text-stone-500 rounded-lg hover:bg-stone-100 transition-colors"
                                      >
                                        Profil
                                      </Link>
                                    </div>
                                  </div>

                                {/* EscrowPanel muncul di bawah setelah accepted */}
                                {app.status === 'accepted' && (
                                  <EscrowPanel
                                    escrow={app.escrow_transactions?.[0] ?? null}
                                    applicationId={app.id}
                                    jobBudget={myJobs.find(j => j.id === job.id)?.budget ?? 0}
                                    isClient={true}
                                    onUpdate={() => handleEscrowUpdate(job.id, app.id)}
                                  />
                                )}

                              </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: TALENT ── */}
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
                {myApplications.map(app => (
                  <div key={app.id} className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-stone-900 text-sm truncate">
                        {app.jobs?.judul ?? 'Lowongan tidak tersedia'}
                      </h3>
                      {app.jobs?.lokasi && (
                        <p className="text-stone-400 text-xs mt-0.5">📍 {app.jobs.lokasi}</p>
                      )}
                      <p className="text-stone-500 text-xs mt-1 line-clamp-1 italic">"{app.pesan}"</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${STATUS_COLOR[app.status] ?? STATUS_COLOR.pending}`}>
                        {STATUS_LABEL[app.status] ?? app.status}
                      </span>
                      <Link
                        href={`/jobs/${app.job_id}`}
                        className="px-3 py-1.5 text-xs border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                      >
                        Lihat
                      </Link>
                      {app.jobs?.user_id && (
                        <Link
                          href={`/chat?jobId=${app.job_id}&withUser=${app.jobs.user_id}`}
                          className="px-3 py-1.5 text-xs bg-indigo-100 text-indigo-600 rounded-lg font-semibold hover:bg-indigo-200 transition-colors"
                        >
                          💬 Chat Poster
                        </Link>
                      )}
                    </div>
                    </div>
                    {app.status === 'accepted' && (
                      <EscrowPanel
                        escrow={app.escrow_transactions?.[0] ?? null}
                        applicationId={app.id}
                        jobBudget={app.jobs?.budget ?? 0}
                        isClient={false}
                        onUpdate={() => handleEscrowUpdate(app.job_id, app.id)}
                      />
                    )}
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

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <p className="text-xs text-stone-400 mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  )
}