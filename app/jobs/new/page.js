'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

const KATEGORI_LIST = [
  { value: 'fotografer', label: '📷 Fotografer' },
  { value: 'mc', label: '🎤 MC' },
  { value: 'it', label: '💻 IT & Programmer' },
  { value: 'event', label: '🎪 Panitia Event' },
  { value: 'dekorator', label: '🎨 Dekorator' },
  { value: 'lainnya', label: '🔧 Lainnya' },
]

export default function NewJobPage() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    judul: '',
    deskripsi: '',
    kategori: 'fotografer',
    lokasi: '',
    budget_min: '',
    budget_max: '',
    durasi: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login'
      else setSession(session)
    })
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.judul.trim() || !form.deskripsi.trim() || !form.lokasi.trim()) {
      setError('Judul, deskripsi, dan lokasi wajib diisi.')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('jobs').insert({
      judul: form.judul.trim(),
      deskripsi: form.deskripsi.trim(),
      kategori: form.kategori,
      lokasi: form.lokasi.trim(),
      budget_min: form.budget_min ? Number(form.budget_min) : null,
      budget_max: form.budget_max ? Number(form.budget_max) : null,
      durasi: form.durasi.trim() || null,
      user_id: session.user.id,
      status: 'open',
    })

    setLoading(false)
    if (error) {
      setError('Gagal posting lowongan: ' + error.message)
    } else {
      router.push('/jobs')
    }
  }

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400">Memuat...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-stone-900 mb-1">Post Lowongan</h1>
          <p className="text-stone-500 text-sm">Isi detail pekerjaan yang kamu butuhkan</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col gap-5">

          {/* Judul */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Judul Lowongan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="judul"
              value={form.judul}
              onChange={handleChange}
              placeholder="cth: Butuh Fotografer Wedding di Surabaya"
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Kategori <span className="text-red-500">*</span>
            </label>
            <select
              name="kategori"
              value={form.kategori}
              onChange={handleChange}
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all bg-white"
            >
              {KATEGORI_LIST.map((k) => (
                <option key={k.value} value={k.value}>{k.label}</option>
              ))}
            </select>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Deskripsi <span className="text-red-500">*</span>
            </label>
            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              rows={4}
              placeholder="Jelaskan pekerjaan, kebutuhan, dan ekspektasimu..."
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none"
            />
          </div>

          {/* Lokasi */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Lokasi <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lokasi"
              value={form.lokasi}
              onChange={handleChange}
              placeholder="cth: Surabaya, Jawa Timur"
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Budget (Rp) <span className="text-stone-400 font-normal">— opsional</span>
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                name="budget_min"
                value={form.budget_min}
                onChange={handleChange}
                placeholder="Minimum"
                min={0}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
              <span className="flex items-center text-stone-400 text-sm shrink-0">–</span>
              <input
                type="number"
                name="budget_max"
                value={form.budget_max}
                onChange={handleChange}
                placeholder="Maksimum"
                min={0}
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
            </div>
            <p className="text-stone-400 text-xs mt-1.5">Kosongkan jika ingin nego</p>
          </div>

          {/* Durasi */}
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Durasi <span className="text-stone-400 font-normal">— opsional</span>
            </label>
            <input
              type="text"
              name="durasi"
              value={form.durasi}
              onChange={handleChange}
              placeholder="cth: 1 hari, 3 jam, 1 minggu"
              className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2.5 text-sm border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer font-medium"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 text-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-lg transition-colors cursor-pointer"
            >
              {loading ? 'Memposting...' : 'Post Lowongan →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}