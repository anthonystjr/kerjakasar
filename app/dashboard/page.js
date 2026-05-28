'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        setUser(session.user)
        setLoading(false)
      } else {
        window.location.href = '/login'
      }
    }
    getUser()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Loading...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Selamat datang, {user?.user_metadata?.full_name || user?.email}!
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 cursor-pointer"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-2">Sebagai Client</h2>
            <p className="text-gray-500 text-sm">Lowongan yang kamu post akan muncul di sini</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="font-bold text-lg mb-2">Sebagai Talent</h2>
            <p className="text-gray-500 text-sm">Lamaran yang kamu kirim akan muncul di sini</p>
          </div>
        </div>
      </div>
    </div>
  )
}