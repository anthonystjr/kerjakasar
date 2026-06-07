'use client'
// components/EscrowPanel.jsx
// Dipakai di dashboard.
// Props:
//   escrow      - object dari escrow_transactions (bisa null)
//   applicationId - string UUID
//   jobBudget   - number (dari job.budget, sebagai default)
//   isClient    - boolean (apakah user adalah pemilik job)
//   onUpdate    - callback() dipanggil setelah aksi berhasil

import { useState } from 'react'

const STATUS_LABEL = {
  pending_payment: '⏳ Menunggu Pembayaran',
  funded:          '✅ Dana Terkunci',
  released:        '🎉 Dana Dicairkan',
  refunded:        '↩️ Dana Dikembalikan',
  disputed:        '⚠️ Sengketa',
}
const STATUS_COLOR = {
  pending_payment: { background: '#fef9c3', color: '#854d0e' },
  funded:          { background: '#dcfce7', color: '#166534' },
  released:        { background: '#dbeafe', color: '#1e40af' },
  refunded:        { background: '#f3f4f6', color: '#374151' },
  disputed:        { background: '#fee2e2', color: '#991b1b' },
}

export default function EscrowPanel({ escrow, applicationId, jobBudget = 0, isClient, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [amount, setAmount] = useState(jobBudget || '')
  const [paymentRef, setPaymentRef] = useState('')
  const [note, setNote] = useState('')
  const [showForm, setShowForm] = useState(null) // 'create'|'fund'|'release'|'refund'

  const call = async (url, body, method = 'POST') => {
    setErr(''); setLoading(true)
    try {
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      if (!r.ok) { setErr(d.error || 'Terjadi kesalahan'); return false }
      onUpdate?.()
      setShowForm(null)
      return true
    } catch { setErr('Gagal menghubungi server') } finally { setLoading(false) }
    return false
  }

  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)

  // ── Belum ada escrow ──────────────────────────────────────────────
  if (!escrow) {
    if (!isClient) return (
      <div style={s.box}>
        <p style={s.info}>Escrow belum dibuat oleh client.</p>
      </div>
    )
    return (
      <div style={s.box}>
        <h3 style={s.title}>🔒 Buat Escrow</h3>
        <p style={s.info}>Kunci dana proyek agar talent merasa aman mengerjakan.</p>
        {showForm === 'create' ? (
          <div style={s.form}>
            <label style={s.label}>Jumlah Dana (Rp)</label>
            <input
              type="number" value={amount} min={1000}
              onChange={e => setAmount(e.target.value)}
              style={s.input} placeholder="cth: 500000"
            />
            {err && <p style={s.err}>{err}</p>}
            <div style={s.row}>
              <button style={s.btnSec} onClick={() => setShowForm(null)}>Batal</button>
              <button style={s.btnPri} disabled={loading}
                onClick={() => call('/api/escrow/create', { application_id: applicationId, amount: Number(amount) })}>
                {loading ? 'Menyimpan...' : 'Buat Escrow'}
              </button>
            </div>
          </div>
        ) : (
          <button style={s.btnPri} onClick={() => setShowForm('create')}>Buat Escrow Sekarang</button>
        )}
      </div>
    )
  }

  const st = escrow.status
  const color = STATUS_COLOR[st] ?? {}

  // ── Ada escrow ────────────────────────────────────────────────────
  return (
    <div style={s.box}>
      <h3 style={s.title}>🔒 Escrow Dana</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ ...s.badge, ...color }}>{STATUS_LABEL[st] ?? st}</span>
        <span style={s.amount}>{fmt(escrow.amount)}</span>
      </div>

      {escrow.payment_ref && <p style={s.meta}>Ref: {escrow.payment_ref}</p>}
      {escrow.note && <p style={s.meta}>Catatan: {escrow.note}</p>}

      {err && <p style={s.err}>{err}</p>}

      {/* ── Aksi berdasar status & role ── */}
      {isClient && st === 'pending_payment' && (
        showForm === 'fund' ? (
          <div style={s.form}>
            <p style={s.info}>Masukkan referensi transfer kamu (no. bukti / nama bank).</p>
            <label style={s.label}>Referensi Pembayaran</label>
            <input value={paymentRef} onChange={e => setPaymentRef(e.target.value)}
              style={s.input} placeholder="cth: BCA-20260607-XXXXX" />
            {err && <p style={s.err}>{err}</p>}
            <div style={s.row}>
              <button style={s.btnSec} onClick={() => setShowForm(null)}>Batal</button>
              <button style={s.btnPri} disabled={loading}
                onClick={() => call('/api/escrow/release', { escrow_id: escrow.id, payment_ref: paymentRef }, 'PATCH')}>
                {loading ? 'Menyimpan...' : 'Konfirmasi Transfer'}
              </button>
            </div>
          </div>
        ) : (
          <div style={s.row}>
            <button style={s.btnPri} onClick={() => setShowForm('fund')}>Konfirmasi Sudah Transfer</button>
            <button style={s.btnDanger} disabled={loading}
              onClick={() => call('/api/escrow/refund', { escrow_id: escrow.id })}>
              Batalkan
            </button>
          </div>
        )
      )}

      {isClient && st === 'funded' && (
        showForm === 'release' ? (
          <div style={s.form}>
            <p style={s.info}>Pekerjaan sudah selesai? Dana akan dicairkan ke talent.</p>
            <label style={s.label}>Catatan (opsional)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              style={s.input} placeholder="cth: Terima kasih, pekerjaan bagus!" />
            <div style={s.row}>
              <button style={s.btnSec} onClick={() => setShowForm(null)}>Batal</button>
              <button style={{ ...s.btnPri, background: '#16a34a' }} disabled={loading}
                onClick={() => call('/api/escrow/release', { escrow_id: escrow.id, note })}>
                {loading ? 'Memproses...' : '🎉 Cairkan Dana'}
              </button>
            </div>
          </div>
        ) : (
          <div style={s.row}>
            <button style={{ ...s.btnPri, background: '#16a34a' }} onClick={() => setShowForm('release')}>
              Cairkan Dana ke Talent
            </button>
            <button style={s.btnDanger} disabled={loading}
              onClick={() => { if (confirm('Refund dana ke kamu?')) call('/api/escrow/refund', { escrow_id: escrow.id }) }}>
              Refund
            </button>
          </div>
        )
      )}

      {!isClient && st === 'funded' && (
        <div style={{ ...s.badge, ...color, display: 'block', textAlign: 'center', padding: '10px 0' }}>
          Dana sudah dikunci. Kerjakan projeknya dan client akan mencairkan setelah selesai.
        </div>
      )}

      {!isClient && st === 'released' && (
        <p style={{ ...s.info, color: '#166534' }}>✅ Dana telah dicairkan ke kamu. Cek rekening / dompetmu.</p>
      )}
    </div>
  )
}

const s = {
  box:    { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginTop: 12 },
  title:  { margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#111' },
  info:   { margin: '0 0 10px', fontSize: 13, color: '#64748b', lineHeight: 1.6 },
  meta:   { margin: '2px 0', fontSize: 12, color: '#94a3b8' },
  badge:  { display: 'inline-block', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 99 },
  amount: { fontSize: 18, fontWeight: 700, color: '#0f172a' },
  form:   { display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 },
  label:  { fontSize: 13, fontWeight: 500, color: '#374151' },
  input:  { border: '1px solid #d1d5db', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' },
  err:    { color: '#dc2626', fontSize: 13, margin: 0 },
  row:    { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  btnPri: { background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 },
  btnSec: { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '9px 18px', fontSize: 13, cursor: 'pointer', flex: 1 },
  btnDanger: { background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', flex: 1 },
}
