import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request) {
  try {
    const { talent_id, job_id, rating, komentar } = await request.json()

    if (!talent_id || !rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Data tidak valid' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    // Cek apakah sudah pernah review talent ini untuk job yang sama
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', user.id)
      .eq('talent_id', talent_id)
      .eq('job_id', job_id)
      .maybeSingle()

    if (existing) {
      return Response.json({ error: 'Kamu sudah memberi ulasan untuk talent ini.' }, { status: 409 })
    }

    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      talent_id,
      job_id,
      rating,
      komentar: komentar?.trim() || null,
    })

    if (error) return Response.json({ error: error.message }, { status: 500 })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
