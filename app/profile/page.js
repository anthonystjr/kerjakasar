'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'

export default function ProfilePage() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nama: '',
    bio: '',
    skills: '',
    wa_number: '',
    foto_url: '',
  })
  const fileInputRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { window.location.href = '/login'; return }
      setSession(session)

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setForm({
          nama: profile.nama ?? session.user.user_metadata?.full_name ?? '',
          bio: profile.bio ?? '',
          skills: Array.isArray(profile.skills) ? profile.skills.join(', ') : '',
          wa_number: profile.wa_number ?? '',
          foto_url: profile.foto_url ?? session.user.user_metadata?.avatar_url ?? '',
        })
      } else {
        setForm((prev) => ({
          ...prev,
          nama: session.user.user_metadata?.full_name ?? '',
          foto_url: session.user.user_metadata?.avatar_url ?? '',
        }))
      }
      setLoading(false)
    }
    init()
  }, [])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setError('Ukuran foto maksimal 2MB')
      return
    }

    setUploadingPhoto(true)
    setError('')

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(`${session.user.id}/avatar`, file, { upsert: true })

    if (uploadError) {
      setError('Gagal upload foto: ' + uploadError.message)
      setUploadingPhoto(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${session.user.id}/avatar`)

    // Fix: tambah timestamp supaya browser tidak pakai cache lama
    const urlWithBust = `${publicUrl}?t=${Date.now()}`
    setForm((prev) => ({ ...prev, foto_url: urlWithBust }))
    setUploadingPhoto(false)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!form.nama.trim()) {
      setError('Nama wajib diisi.')
      return
    }

    setSaving(true)
    const skillsArray = form.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const { error } = await supabase.from('users').upsert({
      id: session.user.id,
      email: session.user.email,
      nama: form.nama.trim(),
      bio: form.bio.trim() || null,
      skills: skillsArray.length > 0 ? skillsArray : null,
      wa_number: form.wa_number.trim() || null,
      // Fix: simpan URL tanpa timestamp ke database
      foto_url: form.foto_url.split('?')[0] || null,
    })

    setSaving(false)
    if (error) {
      setError('Gagal menyimpan: ' + error.message)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-stone-400">Memuat profil...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-stone-900 mb-1">Edit Profil</h1>
          <p className="text-stone-500 text-sm">Lengkapi profilmu agar mudah ditemukan klien</p>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-6">

          {/* Foto Profil */}
          <div className="bg-white border border-stone-200 rounded-xl p-6">
            <h2 className="font-bold text-stone-900 mb-4">Foto Profil</h2>
            <div className="flex items-center gap-5">
              <div className="shrink-0">
                {form.foto_url ? (
                  <img
                    src={form.foto_url}
                    alt="Foto profil"
                    className="w-20 h-20 rounded-full object-cover border-2 border-stone-200"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-3xl font-black border-2 border-stone-200">
                    {form.nama?.[0]?.toUpperCase() ?? '?'}
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 text-sm border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-50 transition-colors cursor-pointer font-medium disabled:opacity-50"
                >
                  {uploadingPhoto ? 'Mengupload...' : 'Ganti Foto'}
                </button>
                <p className="text-stone-400 text-xs mt-1.5">JPG, PNG, maks. 2MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Info Dasar */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 flex flex-col gap-5">
            <h2 className="font-bold text-stone-900">Informasi Dasar</h2>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Nama Lengkap <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                placeholder="Nama yang ditampilkan ke klien"
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Bio <span className="text-stone-400 font-normal">— opsional</span>
              </label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={3}
                placeholder="Ceritakan sedikit tentang dirimu, pengalaman, atau keahlianmu..."
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Keahlian <span className="text-stone-400 font-normal">— opsional</span>
              </label>
              <input
                type="text"
                name="skills"
                value={form.skills}
                onChange={handleChange}
                placeholder="cth: Fotografi, Editing, Lightroom (pisahkan dengan koma)"
                className="w-full px-3 py-2.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
              />
              <p className="text-stone-400 text-xs mt-1.5">Pisahkan setiap keahlian dengan koma</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Nomor WhatsApp <span className="text-stone-400 font-normal">— opsional</span>
              </label>
              <div className="flex">
                <span className="px-3 py-2.5 text-sm bg-stone-100 border border-r-0 border-stone-200 rounded-l-lg text-stone-500">
                  +62
                </span>
                <input
                  type="tel"
                  name="wa_number"
                  value={form.wa_number}
                  onChange={handleChange}
                  placeholder="8123456789"
                  className="flex-1 px-3 py-2.5 text-sm border border-stone-200 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
                />
              </div>
              <p className="text-stone-400 text-xs mt-1.5">Dipakai klien untuk menghubungimu langsung</p>
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-4">
            <p className="text-xs text-stone-500 mb-1">Email akun (tidak bisa diubah)</p>
            <p className="text-sm font-medium text-stone-700">{session?.user?.email}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm px-4 py-3 rounded-lg">
              ✅ Profil berhasil disimpan!
            </div>
          )}

          <button
            type="submit"
            disabled={saving || uploadingPhoto}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold rounded-xl transition-colors cursor-pointer text-sm"
          >
            {saving ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
        </form>
      </div>
    </div>
  )
}