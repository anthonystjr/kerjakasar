import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export async function generateMetadata({ params }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('users')
    .select('nama, bio')
    .eq('id', params.id)
    .single()

  if (!data) return { title: 'Profil tidak ditemukan' }
  return {
    title: `${data.nama} — KerjaKasar`,
    description: data.bio ?? `Lihat profil ${data.nama} di KerjaKasar`,
  }
}

export default async function PublicProfilePage({ params }) {
  const supabase = await createClient()

  const { data: talent } = await supabase
    .from('users')
    .select('id, nama, foto_url, bio, skills, wa_number, created_at')
    .eq('id', params.id)
    .single()

  if (!talent) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, komentar, created_at, reviewer:reviewer_id(nama, foto_url)')
    .eq('talent_id', params.id)
    .order('created_at', { ascending: false })

  // Hitung proyek yang sudah selesai (escrow released)
  const { count: completedCount } = await supabase
    .from('escrow_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('talent_id', params.id)
    .eq('status', 'released')

  const totalReviews = reviews?.length ?? 0
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === params.id

  // Format nomor WA: simpan tanpa +62, tampilkan dengan +62
  const waLink = talent.wa_number
    ? `https://wa.me/62${talent.wa_number.replace(/^0/, '')}`
    : null

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Kartu profil utama */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">

            {/* Foto */}
            {talent.foto_url ? (
              <img
                src={talent.foto_url}
                alt={talent.nama}
                className="w-20 h-20 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center text-3xl font-black shrink-0">
                {talent.nama?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-xl font-black text-stone-900">{talent.nama}</h1>
                {avgRating && (
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-500">
                    ★ {avgRating}
                    <span className="text-stone-400 font-normal text-xs">({totalReviews} ulasan)</span>
                  </span>
                )}
              </div>
              {talent.bio && (
                <p className="text-stone-600 text-sm leading-relaxed mt-1">{talent.bio}</p>
              )}
              <p className="text-stone-400 text-xs mt-2">
                Bergabung{' '}
                {new Date(talent.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 pt-5 border-t border-stone-100 flex gap-6">
            <div className="text-center">
              <p className="text-xl font-black text-indigo-600">{completedCount ?? 0}</p>
              <p className="text-xs text-stone-400 mt-0.5">Proyek Selesai</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-amber-500">{avgRating ?? '—'}</p>
              <p className="text-xs text-stone-400 mt-0.5">Rating</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-black text-stone-700">{totalReviews}</p>
              <p className="text-xs text-stone-400 mt-0.5">Ulasan</p>
            </div>
          </div>

          {/* Skills */}
          {talent.skills?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-stone-100">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">
                Keahlian
              </p>
              <div className="flex flex-wrap gap-2">
                {talent.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tombol aksi */}
          <div className="mt-5 pt-5 border-t border-stone-100 flex gap-2 flex-wrap">
            {isOwner ? (
              <Link
                href="/profile"
                className="px-4 py-2 text-sm bg-stone-900 text-white font-bold rounded-lg hover:bg-stone-700 transition-colors"
              >
                Edit Profil
              </Link>
            ) : (
              <>
                {/* Tombol WA — hanya tampil kalau ada wa_number dan user login */}
                {user && waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-sm bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>
                )}
                {user && (
                  <Link
                    href={`/chat?withUser=${talent.id}&jobId=direct`}
                    className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                  >
                    💬 Chat
                  </Link>
                )}
                {!user && (
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                  >
                    Login untuk Menghubungi
                  </Link>
                )}
              </>
            )}
            <Link
              href="/jobs"
              className="px-4 py-2 text-sm border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
            >
              Lihat Lowongan
            </Link>
          </div>
        </div>

        {/* Ulasan */}
        <div>
          <h2 className="font-bold text-stone-900 mb-3">
            Ulasan
            {totalReviews > 0 && (
              <span className="ml-2 text-stone-400 font-normal text-sm">({totalReviews})</span>
            )}
          </h2>

          {totalReviews === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl py-12 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <p className="text-stone-500 font-medium text-sm">Belum ada ulasan</p>
              <p className="text-stone-400 text-xs mt-1">Ulasan akan muncul setelah proyek selesai</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map((review) => (
                <div key={review.id} className="bg-white border border-stone-200 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    {review.reviewer?.foto_url ? (
                      <img
                        src={review.reviewer.foto_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-sm font-black">
                        {review.reviewer?.nama?.[0]?.toUpperCase() ?? '?'}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-stone-900">
                        {review.reviewer?.nama ?? 'Anonim'}
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(review.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-base ${
                            star <= review.rating ? 'text-amber-400' : 'text-stone-200'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.komentar && (
                    <p className="text-stone-600 text-sm leading-relaxed">{review.komentar}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
