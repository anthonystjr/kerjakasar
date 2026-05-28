import { Resend } from 'resend'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
  try {
    const { job_id, application_id } = await request.json()

    // Verifikasi session
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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch data job + pemberi kerja + pelamar
    const { data: application } = await supabase
      .from('applications')
      .select('*, jobs(judul, lokasi, user_id, users(nama, email)), talent:users!applications_talent_id_fkey(nama, email, wa_number)')
      .eq('id', application_id)
      .single()

    if (!application) {
      return Response.json({ error: 'Application not found' }, { status: 404 })
    }

    const jobTitle = application.jobs?.judul ?? 'Lowongan'
    const jobLocation = application.jobs?.lokasi ?? ''
    const clientName = application.jobs?.users?.nama ?? 'Pemberi Kerja'
    const clientEmail = application.jobs?.users?.email
    const talentName = application.talent?.nama ?? user.user_metadata?.full_name ?? 'Pelamar'
    const talentEmail = application.talent?.email ?? user.email
    const talentWa = application.talent?.wa_number
    const pesan = application.pesan

    if (!clientEmail) {
      return Response.json({ error: 'Client email not found' }, { status: 400 })
    }

    // Kirim email ke pemberi kerja
    const { error } = await resend.emails.send({
      from: 'KerjaKasar <onboarding@resend.dev>',
      to: clientEmail,
      subject: `Lamaran Baru: ${jobTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #1c1917;">
          <div style="background: #ea580c; padding: 24px 32px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 900;">
              KerjaKasar
            </h1>
          </div>
          <div style="background: white; border: 1px solid #e7e5e4; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">
            <p style="color: #57534e; margin: 0 0 20px;">
              Hei <strong>${clientName}</strong>, ada pelamar baru untuk lowonganmu!
            </p>

            <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 4px; font-size: 12px; color: #9a3412; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Lowongan</p>
              <p style="margin: 0; font-weight: 700; font-size: 16px;">${jobTitle}</p>
              ${jobLocation ? `<p style="margin: 4px 0 0; font-size: 13px; color: #78716c;">📍 ${jobLocation}</p>` : ''}
            </div>

            <div style="background: #f5f5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; font-size: 12px; color: #78716c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Data Pelamar</p>
              <p style="margin: 0 0 4px;"><strong>Nama:</strong> ${talentName}</p>
              <p style="margin: 0 0 4px;"><strong>Email:</strong> ${talentEmail}</p>
              ${talentWa ? `<p style="margin: 0;"><strong>WhatsApp:</strong> +62${talentWa}</p>` : ''}
            </div>

            <div style="margin-bottom: 28px;">
              <p style="margin: 0 0 8px; font-size: 12px; color: #78716c; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Pesan Lamaran</p>
              <p style="margin: 0; color: #44403c; line-height: 1.6; font-style: italic; border-left: 3px solid #ea580c; padding-left: 12px;">
                "${pesan}"
              </p>
            </div>

            ${talentWa ? `
            <a href="https://wa.me/62${talentWa.replace(/^0/, '')}" 
               style="display: block; background: #22c55e; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-bottom: 12px;">
              💬 Hubungi via WhatsApp
            </a>` : ''}

            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard"
               style="display: block; background: #1c1917; color: white; text-align: center; padding: 14px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px;">
              Lihat di Dashboard →
            </a>

            <p style="margin: 24px 0 0; font-size: 12px; color: #a8a29e; text-align: center;">
              Email ini dikirim otomatis oleh KerjaKasar
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })

  } catch (err) {
    console.error('API error:', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}