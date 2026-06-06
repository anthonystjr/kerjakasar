import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage({ searchParams }) {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jobId = searchParams.jobId
  const otherUserId = searchParams.with

  if (!jobId || !otherUserId) redirect('/dashboard')

  const { data: currentProfile } = await supabase
    .from('users')
    .select('id, nama, foto')
    .eq('id', user.id)
    .single()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, judul')
    .eq('id', jobId)
    .single()

  const { data: otherProfile } = await supabase
    .from('users')
    .select('id, nama, foto')
    .eq('id', otherUserId)
    .single()

  if (!job || !otherProfile) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ChatWindow
          jobId={job.id}
          jobTitle={job.judul}
          currentUser={currentProfile}
          otherUser={otherProfile}
        />
      </div>
    </div>
  )
}