// app/api/escrow/update-amount/route.js
// Client isi jumlah dana setelah escrow auto-dibuat dengan amount 0
// Body: { escrow_id, amount }

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { escrow_id, amount } = await req.json()
  if (!escrow_id || !amount || Number(amount) < 1000) {
    return NextResponse.json({ error: 'amount minimal Rp 1.000' }, { status: 400 })
  }

  const { data: escrow } = await supabase
    .from('escrow_transactions')
    .select('id, client_id, status, amount')
    .eq('id', escrow_id)
    .single()

  if (!escrow) return NextResponse.json({ error: 'Escrow tidak ditemukan' }, { status: 404 })
  if (escrow.client_id !== user.id) return NextResponse.json({ error: 'Bukan pemilik escrow' }, { status: 403 })
  if (escrow.status !== 'pending_payment') {
    return NextResponse.json({ error: 'Jumlah hanya bisa diubah sebelum transfer' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('escrow_transactions')
    .update({ amount: Number(amount) })
    .eq('id', escrow_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ escrow: data })
}
