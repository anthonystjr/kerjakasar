'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useUnreadCount } from '@/hooks/useUnreadCount'

export default function Navbar() {
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const unread = useUnreadCount(user?.id)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-black text-xl text-stone-900 tracking-tight">
          Kerja<span className="text-orange-500">Kasar</span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href="/jobs"
            className="text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
          >
            Cari Kerja
          </Link>
          <Link
            href="/talents"
            className="text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
          >
            Cari Talent
          </Link>
          {user && (
            <Link
              href="/jobs/new"
              className="text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
            >
              Post Lowongan
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="relative text-stone-600 hover:text-stone-900 text-sm font-medium transition-colors"
              >
                Dashboard
                {unread > 0 && (
                  <span className="absolute -top-2 -right-3 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-700 cursor-pointer transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 font-medium transition-colors"
            >
              Masuk
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="sm:hidden p-2 text-stone-600 cursor-pointer"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-stone-100 bg-white px-4 py-3 flex flex-col gap-3">
          <Link href="/jobs" className="text-stone-700 text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
            Cari Kerja
          </Link>
          <Link href="/talents" className="text-stone-700 text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
            Cari Talent
          </Link>
          {user && (
            <Link href="/jobs/new" className="text-stone-700 text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
              Post Lowongan
            </Link>
          )}
          {user ? (
            <>
              <Link href="/dashboard" className="relative inline-flex items-center gap-2 text-stone-700 text-sm font-medium py-1" onClick={() => setMenuOpen(false)}>
                Dashboard
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                    {unread > 99 ? '99+' : unread}
                  </span>
                )}
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-red-500 font-medium py-1 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="inline-block text-sm bg-orange-500 text-white px-4 py-2 rounded-lg font-medium text-center"
              onClick={() => setMenuOpen(false)}
            >
              Masuk
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}