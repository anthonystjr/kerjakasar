'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ChatWindow({ jobId, jobTitle, currentUser, otherUser }) {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('job_id', jobId)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUser.id}),` +
          `and(sender_id.eq.${otherUser.id},receiver_id.eq.${currentUser.id})`
        )
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
    }
    fetchMessages()
  }, [jobId, currentUser.id, otherUser.id])

  useEffect(() => {
    const channel = supabase
      .channel(`chat:${jobId}:${[currentUser.id, otherUser.id].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          const msg = payload.new
          const isRelevant =
            (msg.sender_id === currentUser.id && msg.receiver_id === otherUser.id) ||
            (msg.sender_id === otherUser.id && msg.receiver_id === currentUser.id)
          if (isRelevant) {
            setMessages((prev) => [...prev, msg])
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [jobId, currentUser.id, otherUser.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    const { error } = await supabase.from('messages').insert({
      job_id: jobId,
      sender_id: currentUser.id,
      receiver_id: otherUser.id,
      content: text.trim(),
    })
    if (!error) setText('')
    setSending(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col"
      style={{ height: '75vh' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-100 flex items-center gap-3">
        <Link href="/dashboard" className="text-stone-400 hover:text-stone-600 transition-colors text-lg">
          ←
        </Link>
        {otherUser.foto_url ? (
          <img
            src={otherUser.foto_url}
            alt=""
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-500 flex items-center justify-center font-black text-sm">
            {otherUser.nama?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-stone-900 text-sm truncate">{otherUser.nama}</p>
          <p className="text-stone-400 text-xs truncate">Re: {jobTitle}</p>
        </div>
      </div>

      {/* Pesan */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-center text-stone-400 text-sm mt-8">
            Belum ada pesan. Mulai percakapan!
          </p>
        )}
        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id
          return (
            <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs sm:max-w-sm px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-stone-900 text-white rounded-br-sm'
                    : 'bg-stone-100 text-stone-800 rounded-bl-sm'
                }`}
              >
                {msg.content}
                <p className="text-xs mt-1 text-stone-400">
                  {new Date(msg.created_at).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-stone-100 flex gap-2 items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan... (Enter untuk kirim)"
          rows={1}
          className="flex-1 resize-none bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-300 transition-all"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="px-4 py-2 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
        >
          {sending ? '...' : 'Kirim'}
        </button>
      </div>
    </div>
  )
}