import { createClient } from '@supabase/supabase-js'

const productionAdminUrl = 'https://smartroomz.vercel.app/admin?setup=1'

async function authorizedAdmin(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return null
  const { data: profile } = await db.from('profiles').select('id').eq('id', user.id).eq('role', 'admin').maybeSingle()
  return profile ? user : null
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: 'Admin setup is unavailable.' })

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  const admin = await authorizedAdmin(req, db)
  if (!admin) return res.status(403).json({ error: 'Administrator access is required.' })

  if (req.method === 'GET') {
    const { data, error } = await db.from('profiles').select('id,email,full_name,created_at').eq('role', 'admin').order('created_at')
    if (error) return res.status(500).json({ error: 'Could not load team members.' })
    return res.status(200).json({ members: data || [] })
  }

  const email = String(req.body?.email || '').trim().toLowerCase()
  const fullName = String(req.body?.fullName || '').trim()
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })

  const { error: allowError } = await db.from('admin_allowlist').upsert({ email })
  if (allowError) return res.status(500).json({ error: 'Could not authorize this email.' })

  const { data: existing } = await db.from('profiles').select('id').eq('email', email).maybeSingle()
  if (existing?.id) {
    const { error } = await db.from('profiles').update({ role: 'admin', ...(fullName ? { full_name: fullName } : {}) }).eq('id', existing.id)
    if (error) return res.status(500).json({ error: 'Could not promote this member.' })
    return res.status(200).json({ success: true, invited: false, message: `${email} now has admin access.` })
  }

  const { error: inviteError } = await db.auth.admin.inviteUserByEmail(email, {
    data: fullName ? { full_name: fullName } : {},
    redirectTo: productionAdminUrl,
  })
  if (inviteError) return res.status(502).json({ error: `Admin access was saved, but Supabase could not send the invitation: ${inviteError.message}` })
  return res.status(200).json({ success: true, invited: true, message: `Invitation sent to ${email}.` })
}
