import { createClient } from '@supabase/supabase-js'

async function isAdmin(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return false
  const { data } = await db.from('profiles').select('id').eq('id', user.id).eq('role', 'admin').maybeSingle()
  return Boolean(data)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.VAPI_PRIVATE_KEY) {
    return res.status(503).json({ error: 'Recording playback is unavailable.' })
  }

  const callId = String(req.query?.id || '').trim()
  if (!/^[a-zA-Z0-9-]{8,100}$/.test(callId)) return res.status(400).json({ error: 'Invalid call ID.' })

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  if (!(await isAdmin(req, db))) return res.status(403).json({ error: 'Administrator access is required.' })

  const { data: call } = await db.from('vapi_calls').select('id,recording_url').eq('id', callId).maybeSingle()
  if (!call?.recording_url) return res.status(404).json({ error: 'Recording not found.' })

  try {
    const recording = await fetch(`https://api.vapi.ai/call/${encodeURIComponent(callId)}/mono-recording`, {
      headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` },
      redirect: 'follow',
    })
    if (!recording.ok || !recording.body) throw new Error(`Vapi returned ${recording.status}.`)

    res.statusCode = 200
    res.setHeader('Content-Type', recording.headers.get('content-type') || 'audio/wav')
    res.setHeader('Cache-Control', 'private, no-store')
    res.setHeader('Content-Disposition', `inline; filename="${callId}.wav"`)

    const reader = recording.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(Buffer.from(value))
    }
    return res.end()
  } catch (error) {
    console.error('Vapi recording retrieval failed:', error)
    if (!res.headersSent) return res.status(502).json({ error: 'Could not retrieve this recording.' })
    return res.end()
  }
}
