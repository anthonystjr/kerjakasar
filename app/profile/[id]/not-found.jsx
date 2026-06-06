import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">👤</div>
        <h1 className="text-xl font-black text-stone-900 mb-2">Profil tidak ditemukan</h1>
        <p className="text-stone-400 text-sm mb-6">
          Talent yang kamu cari tidak ada atau sudah dihapus.
        </p>
        <Link
          href="/jobs"
          className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
        >
          Lihat Lowongan →
        </Link>
      </div>
    </div>
  )
}
