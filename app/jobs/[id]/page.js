const handleApply = async (e) => {
  e.preventDefault()
  setError('')

  if (!pesan.trim()) {
    setError('Pesan lamaran tidak boleh kosong.')
    return
  }

  setSubmitting(true)

  // Insert lamaran ke database
  const { data: newApp, error: insertError } = await supabase
    .from('applications')
    .insert({
      job_id: id,
      talent_id: session.user.id,
      pesan: pesan.trim(),
      status: 'pending',
    })
    .select()
    .single()

  if (insertError) {
    setError('Gagal mengirim lamaran: ' + insertError.message)
    setSubmitting(false)
    return
  }

  // Kirim notifikasi email (best-effort, tidak blokir kalau gagal)
  try {
    await fetch('/api/send-application', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        job_id: id,
        application_id: newApp.id,
      }),
    })
  } catch (emailErr) {
    console.warn('Email notification failed (non-critical):', emailErr)
  }

  setSubmitting(false)
  setSubmitSuccess(true)
  setSudahLamar(true)
  setShowForm(false)
}