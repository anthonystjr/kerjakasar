'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  useEffect(() => {
    const handleSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/login'
      }
    }

    // Tunggu sebentar agar Supabase baca hash dari URL
    setTimeout(handleSession, 1000)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Memuat...</p>
    </div>
  )
}