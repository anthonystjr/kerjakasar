import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUnreadCount(userId) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!userId) return

    const fetchCount = async () => {
      const { count: unread } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false)

      setCount(unread || 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`unread:${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, fetchCount)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, fetchCount)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId])

  return count
}
