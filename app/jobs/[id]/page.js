'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function JobDetailPage() {
  const { id } = useParams()
  const router = useRouter()

  const [job, setJob] = useState(null)
  const [poster, setPoster] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  const [sudahLamar, setSudahLamar] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [pesan, setPesan] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      const { data: jobData } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()

      if (!jobData) { router.push('/jobs'); return }
      setJob(jobData)

      const { data: posterData } = await supabase
        .from('users')
        .select('id, nama, foto_url, bio')
        .eq('id', jobData.user_id)
        .single()
      setPoster(posterData)

      if (session?.user) {
        // Fix 1: pakai maybeSingle()
        const { data: existingApp } = await supabase
          .from('applications')
          .select('id')
          .eq('job_id', id)
          .eq('talent_id', session.user.id)
          .maybeSingle()
        if (existingApp) setSudahLamar(true)
      }

      setLoading(false)
    }

    load()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession)

        if (newSession?.user && id) {
          // Fix 2: pakai maybeSingle()
          const { data: existingApp } = await supabase
            .from('applications')
            .select('id')
            .eq('job_id', id)
            .eq('talent_id', newSession.user.id)
            .maybeSingle()
          setSudahLamar(!!existingApp)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [id])

  const handleApply = async (e) => {
    e.preventDefault()
    setError('')

    if (!pesan.trim()) {
      setError('Pesan lamaran tidak boleh kosong.')
      return
    }

    setSubmitting(true)

    const { data: newApp, error: insertError } = await supabase
      .from('applications')
      .insert({
        job_id: id,
        talent_id: session.user.id,
        pesan: pesan.trim(),
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      setError('Gagal mengirim lamaran: ' + insertError.message)
      setSubmitting(false)
      return
    }

    try {
      await fetch('/api/send-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: id, application_id: newApp.id }),
      })
    } catch (emailErr) {
      console.warn('Email notification failed (non-critical):', emailErr)
    }

    setSubmitting(false)
    setSubmitSuccess(true)
    setSudahLamar(true)
    setShowForm(false)
  }

  const isOwner = session?.user?.id === job?.user_id

  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.loadingWrap}>
          <p style={s.loadingText}>Memuat lowongan...</p>
        </div>
      </div>
    )
  }

  if (!job) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar />
      <div style={s.page}>
      <div style={s.container}>

        <button onClick={() => router.back()} style={s.backBtn}>
          ← Kembali
        </button>

        {/* Header job */}
        <div style={s.card}>
          <div style={s.headerRow}>
            <div style={{ flex: 1 }}>
              <span style={s.badge}>{job.kategori}</span>
              <h1 style={s.title}>{job.judul}</h1>
              <div style={s.metaRow}>
                {job.lokasi && <span style={s.meta}>📍 {job.lokasi}</span>}
                {job.budget_min && job.budget_max && (
                  <span style={s.meta}>
                    💰 Rp {Number(job.budget_min).toLocaleString('id-ID')} – {Number(job.budget_max).toLocaleString('id-ID')}
                  </span>
                )}
                <span style={s.meta}>
                  📅 {new Date(job.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div style={s.twoCol}>
          {/* Kolom kiri */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={s.card}>
              <h2 style={s.sectionTitle}>Deskripsi Pekerjaan</h2>
              <p style={s.desc}>{job.deskripsi}</p>
            </div>

            {submitSuccess && (
              <div style={s.successBanner}>
                ✅ Lamaran berhasil dikirim! Tunggu konfirmasi dari poster.
              </div>
            )}

            {showForm && (
              <div style={s.card}>
                <h2 style={s.sectionTitle}>Kirim Lamaran</h2>
                <form onSubmit={handleApply}>
                  <label style={s.label}>Pesan untuk Poster</label>
                  <textarea
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    placeholder="Perkenalkan dirimu dan jelaskan kenapa kamu cocok untuk pekerjaan ini..."
                    rows={5}
                    style={s.textarea}
                  />
                  {error && <p style={s.errorText}>{error}</p>}
                  <div style={s.formActions}>
                    <button type="button" onClick={() => setShowForm(false)} style={s.btnSecondary}>
                      Batal
                    </button>
                    <button type="submit" disabled={submitting} style={s.btnPrimary}>
                      {submitting ? 'Mengirim...' : 'Kirim Lamaran'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Kolom kanan */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {poster && (
              <div style={s.card}>
                <h2 style={s.sectionTitle}>Dipasang oleh</h2>
                <div style={s.posterRow}>
                  <div style={s.posterAvatar}>
                    {poster.foto_url
                      ? <img src={poster.foto_url} alt={poster.nama} style={s.posterAvatarImg} />
                      : <span style={s.posterInitial}>{poster.nama?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div>
                    <p style={s.posterName}>{poster.nama}</p>
                    {poster.bio && <p style={s.posterBio}>{poster.bio}</p>}
                  </div>
                </div>
              </div>
            )}

            <div style={s.card}>
              {!session ? (
                <button onClick={() => router.push(`/login?redirect=/jobs/${id}`)} style={s.btnPrimary}>
                  Login untuk Melamar
                </button>
              ) : isOwner ? (
                <div style={s.ownerNote}>
                  <p style={s.ownerText}>Ini adalah lowongan yang kamu buat.</p>
                  <button onClick={() => router.push('/dashboard')} style={s.btnSecondary}>
                    Lihat di Dashboard
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {sudahLamar ? (
                    <div style={s.alreadyApplied}>✓ Kamu sudah melamar pekerjaan ini</div>
                  ) : (
                    <button
                      onClick={() => setShowForm(true)}
                      disabled={showForm}
                      style={{ ...s.btnPrimary, opacity: showForm ? 0.5 : 1 }}
                    >
                      Lamar Sekarang
                    </button>
                  )}
                  {poster && (
                    <button
                      onClick={() => router.push(`/chat?jobId=${job.id}&withUser=${poster.id}`)}
                      style={s.btnChat}
                    >
                      💬 Chat dengan Poster
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  page: { padding: '2rem 1rem' },
  container: { maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 },
  loadingWrap: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' },
  loadingText: { color: '#6b7280', fontSize: 16 },
  backBtn: { background: 'none', border: 'none', color: '#4f46e5', cursor: 'pointer', fontSize: 14, padding: '4px 0', alignSelf: 'flex-start' },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' },
  headerRow: { display: 'flex', alignItems: 'flex-start', gap: 16 },
  badge: { display: 'inline-block', background: '#ede9fe', color: '#5b21b6', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99, marginBottom: 8 },
  title: { margin: '0 0 12px', fontSize: 24, fontWeight: 700, color: '#111' },
  metaRow: { display: 'flex', flexWrap: 'wrap', gap: 16 },
  meta: { fontSize: 14, color: '#6b7280' },
  twoCol: { display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' },
  sectionTitle: { margin: '0 0 12px', fontSize: 16, fontWeight: 600, color: '#111' },
  desc: { margin: 0, fontSize: 15, color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap' },
  posterRow: { display: 'flex', alignItems: 'center', gap: 12 },
  posterAvatar: { width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  posterAvatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  posterInitial: { fontSize: 18, fontWeight: 700, color: '#4338ca' },
  posterName: { margin: 0, fontWeight: 600, fontSize: 15, color: '#111' },
  posterBio: { margin: '4px 0 0', fontSize: 13, color: '#6b7280' },
  label: { display: 'block', fontSize: 14, fontWeight: 500, color: '#374151', marginBottom: 6 },
  textarea: { width: '100%', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 12px', fontSize: 14, fontFamily: 'inherit', color: '#111', resize: 'vertical', outline: 'none', boxSizing: 'border-box' },
  errorText: { color: '#dc2626', fontSize: 13, margin: '6px 0 0' },
  formActions: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 },
  btnPrimary: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  btnSecondary: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 500, cursor: 'pointer', width: '100%' },
  btnChat: { background: '#fff', color: '#4f46e5', border: '1.5px solid #4f46e5', borderRadius: 8, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' },
  successBanner: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '12px 16px', fontSize: 14, color: '#166534' },
  alreadyApplied: { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: '#166534', textAlign: 'center' },
  ownerNote: { display: 'flex', flexDirection: 'column', gap: 8 },
  ownerText: { margin: 0, fontSize: 13, color: '#6b7280', textAlign: 'center' },
}