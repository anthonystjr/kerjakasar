import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-black text-stone-900 mb-2">Halaman tidak ditemukan</h1>
        <p className="text-stone-400 text-sm mb-8 leading-relaxed">
          Halaman yang kamu cari tidak ada atau sudah dipindahkan.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            Ke Beranda
          </Link>
          <Link
            href="/jobs"
            className="px-5 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-lg hover:bg-stone-50 transition-colors"
          >
            Cari Lowongan
          </Link>
        </div>
      </div>
    </div>
  )
}
