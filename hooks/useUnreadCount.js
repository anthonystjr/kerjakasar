// hooks/useUnreadCount.js
// Pakai ini di Navbar untuk tampilkan badge jumlah pesan belum dibaca

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    async function fetchCount() {
      // Ambil semua conversation milik user ini
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .or(`client_id.eq.${userId},talent_id.eq.${userId}`)

      if (!convs?.length) return

      const convIds = convs.map((c) => c.id)

      // Hitung pesan belum dibaca yang bukan dari user ini
      const { count: unread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', convIds)
        .neq('sender_id', userId)
        .eq('is_read', false)

      setCount(unread || 0)
    }

    fetchCount()

    // Update real-time saat ada pesan baru
    const channel = supabase
      .channel('unread-count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchCount()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchCount()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return count
}

// ─── Contoh pemakaian di Navbar ────────────────────────────────────────
//
// import { useUnreadCount } from '@/hooks/useUnreadCount'
//
// function Navbar({ user }) {
//   const unread = useUnreadCount(user?.id)
//
//   return (
//     <nav>
//       <a href="/messages" style={{ position: 'relative' }}>
//         💬
//         {unread > 0 && (
//           <span style={{
//             position: 'absolute', top: -6, right: -6,
//             background: '#ef4444', color: '#fff',
//             borderRadius: '999px', fontSize: 10,
//             padding: '1px 5px', fontWeight: 600
//           }}>
//             {unread > 99 ? '99+' : unread}
//           </span>
//         )}
//       </a>
//     </nav>
//   )
// }
