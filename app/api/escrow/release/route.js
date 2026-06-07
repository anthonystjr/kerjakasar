// app/api/escrow/release/route.js
// 2 fungsi:
//   PATCH → client konfirmasi sudah transfer (funded)
//   POST  → client release dana ke talent (released)
// Body PATCH: { escrow_id, payment_ref, payment_proof_url? }
// Body POST : { escrow_id, note? }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Client konfirmasi sudah transfer → status: funded
export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, payment_ref, payment_proof_url } = await req.json()
  if (!escrow_id || !payment_ref) {
    return NextResponse.json({ error: 'escrow_id dan payment_ref wajib' }, { status: 400 })
  }

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('id, client_id, status')
    .eq('id', escrow_id)
    .single()

  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (escrow.status !== 'pending_payment') {
    return NextResponse.json({ error: `Status tidak valid: ${escrow.status}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'funded', payment_ref, payment_proof_url, funded_at: new Date().toISOString() })
    .eq('id', escrow_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escrow: data })
}

// Client release dana ke talent (pekerjaan selesai)
export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, note } = await req.json()
  if (!escrow_id) return NextResponse.json({ error: 'escrow_id wajib' }, { status: 400 })

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('id, client_id, talent_id, amount, status, job_id')
    .eq('id', escrow_id)
    .single()

  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (escrow.status !== 'funded') {
    return NextResponse.json({ error: 'Dana belum dikonfirmasi (status harus funded)' }, { status: 400 })
  }

  // Update escrow → released
  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'released', released_at: new Date().toISOString(), note })
    .eq('id', escrow_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Tutup job otomatis
  await supabase.from('jobs').update({ status: 'closed' }).eq('id', escrow.job_id)

  return NextResponse.json({ escrow: data })
}
