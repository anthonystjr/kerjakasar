// app/api/escrow/create/route.js
// Dipanggil saat client menerima (accept) pelamar
// Body: { application_id, amount }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, amount } = await req.json()
  if (!application_id || !amount || amount < 1000) {
    return NextResponse.json({ error: 'application_id dan amount (min 1000) wajib diisi' }, { status: 400 })
  }

  // Ambil data aplikasi + job sekaligus
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('id, job_id, talent_id, status, jobs(user_id, title)')
    .eq('id', application_id)
    .single()

  if (appErr || !app) return NextResponse.json({ error: 'Aplikasi tidak ditemukan' }, { status: 404 })
  if (app.jobs.user_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik job' }, { status: 403 })
  if (app.status !== 'accepted') return NextResponse.json({ error: 'Aplikasi belum diterima' }, { status: 400 })

  // Cek escrow sudah ada belum
  const { data: existing } = await supabase
    .from('escrow_transactions')
    .select('id, status')
    .eq('application_id', application_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'Escrow sudah ada', escrow: existing }, { status: 409 })

  // Buat escrow dengan status pending_payment
  const { data: escrow, error } = await supabase
    .from('escrow_transactions')
    .insert({
      job_id: app.job_id,
      application_id,
      client_id: user.id,
      talent_id: app.talent_id,
      amount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ escrow }, { status: 201 })
}
