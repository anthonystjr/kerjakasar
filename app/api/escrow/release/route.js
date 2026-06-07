// app/api/escrow/release/route.js
// PATCH → konfirmasi transfer (funded)
// POST  → cairkan dana ke talent (released)

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getEscrow(supabase, escrow_id) {
  const { data, error } = await supabase
    .from('escrow_transactions')
    .select('id, client_id, talent_id, amount, status, job_id')
    .eq('id', escrow_id)
    .maybeSingle()
  return { escrow: data, error }
}

export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, payment_ref, payment_proof_url } = await req.json()
  if (!escrow_id || !payment_ref) return NextResponse.json({ error: 'escrow_id dan payment_ref wajib' }, { status: 400 })

  const { escrow } = await getEscrow(supabase, escrow_id)
  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (escrow.status !== 'pending_payment') return NextResponse.json({ error: `Status tidak valid: ${escrow.status}` }, { status: 400 })

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'funded', payment_ref, payment_proof_url, funded_at: new Date().toISOString() })
    .eq('id', escrow_id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escrow: data })
}

export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, note } = await req.json()
  if (!escrow_id) return NextResponse.json({ error: 'escrow_id wajib' }, { status: 400 })

  const { escrow } = await getEscrow(supabase, escrow_id)
  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (escrow.status !== 'funded') return NextResponse.json({ error: 'Dana belum dikonfirmasi' }, { status: 400 })

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'released', released_at: new Date().toISOString(), note })
    .eq('id', escrow_id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('jobs').update({ status: 'closed' }).eq('id', escrow.job_id)
  return NextResponse.json({ escrow: data })
}
