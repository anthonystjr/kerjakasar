import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import ChatWindow from '@/components/ChatWindow'

export default async function ChatPage({ searchParams }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const jobId = searchParams.jobId
  const otherUserId = searchParams.withUser

  if (!otherUserId) redirect('/dashboard')

  const { data: currentProfile } = await supabase
    .from('users')
    .select('id, nama, foto_url')
    .eq('id', user.id)
    .single()

  let job = null
  if (jobId && jobId !== 'direct') {
    const { data } = await supabase
      .from('jobs')
      .select('id, judul')
      .eq('id', jobId)
      .single()
    job = data
  }

  const { data: otherProfile } = await supabase
    .from('users')
    .select('id, nama, foto_url')
    .eq('id', otherUserId)
    .single()

  if (!otherProfile) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ChatWindow
          jobId={jobId ?? 'direct'}
          jobTitle={job?.judul ?? `Chat dengan ${otherProfile.nama}`}
          currentUser={currentProfile}
          otherUser={otherProfile}
        />
      </div>
    </div>
  )
}