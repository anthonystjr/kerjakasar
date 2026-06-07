// app/api/escrow/create/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { application_id, amount } = await req.json()
  if (!application_id) {
    return NextResponse.json({ error: 'application_id wajib diisi' }, { status: 400 })
  }

  const safeAmount = Number(amount) || 0

  // Ambil data aplikasi — tidak cek status, sudah dihandle di dashboard
  const { data: app, error: appErr } = await supabase
    .from('applications')
    .select('id, job_id, talent_id, jobs(user_id)')
    .eq('id', application_id)
    .single()

  if (appErr || !app) return NextResponse.json({ error: 'Aplikasi tidak ditemukan' }, { status: 404 })
  if (app.jobs.user_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik job' }, { status: 403 })

  // Kalau sudah ada, return existing (idempotent)
  const { data: existing } = await supabase
    .from('escrow_transactions')
    .select('*')
    .eq('application_id', application_id)
    .maybeSingle()

  if (existing) return NextResponse.json({ escrow: existing }, { status: 200 })

  const { data: escrow, error } = await supabase
    .from('escrow_transactions')
    .insert({
      job_id: app.job_id,
      application_id,
      client_id: user.id,
      talent_id: app.talent_id,
      amount: safeAmount,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escrow }, { status: 201 })
}
