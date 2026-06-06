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
    .select('id, nama, foto_url, bio, skills, created_at')
    .eq('id', params.id)
    .single()

  if (!talent) notFound()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, komentar, created_at, reviewer:reviewer_id(nama, foto_url)')
    .eq('talent_id', params.id)
    .order('created_at', { ascending: false })

  const totalReviews = reviews?.length ?? 0
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : null

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = user?.id === params.id

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
              user && (
                <Link
                  href={`/chat?withUser=${talent.id}&jobId=direct`}
                  className="px-4 py-2 text-sm bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                >
                  💬 Hubungi
                </Link>
              )
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
