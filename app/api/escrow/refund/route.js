// app/api/escrow/refund/route.js
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, note } = await req.json()
  if (!escrow_id) return NextResponse.json({ error: 'escrow_id wajib' }, { status: 400 })

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('id, client_id, status')
    .eq('id', escrow_id)
    .maybeSingle()

  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (!['pending_payment', 'funded'].includes(escrow.status)) {
    return NextResponse.json({ error: `Tidak bisa refund dari status: ${escrow.status}` }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ status: 'refunded', refunded_at: new Date().toISOString(), note: note ?? 'Dibatalkan oleh client' })
    .eq('id', escrow_id)
    .select()
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escrow: data })
}
