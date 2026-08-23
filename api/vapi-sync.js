import { createClient } from '@supabase/supabase-js'
import { mapVapiCall } from '../server/vapiCalls.js'

const VAPI_URL = 'https://api.vapi.ai/call'
// The user-verified production baseline: first call in the 22-call export.
// Everything before this timestamp was test traffic and must not enter reporting.
const EARLIEST_SYNC = '2026-08-20T18:58:30.249Z'
const MAX_WINDOW_DEPTH = 18

export const config = { maxDuration: 60 }

async function isAdmin(req, db) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return false
  const { data: { user }, error } = await db.auth.getUser(token)
  if (error || !user) return false
  const { data } = await db.from('profiles').select('id').eq('id', user.id).eq('role', 'admin').maybeSingle()
  return Boolean(data)
}

async function fetchWindow(apiKey, start, end, depth = 0) {
  const query = new URLSearchParams({ limit: '100', createdAtGe: start.toISOString(), createdAtLt: end.toISOString() })
  const response = await fetch(`${VAPI_URL}?${query}`, { headers: { Authorization: `Bearer ${apiKey}` } })
  if (!response.ok) throw new Error(`Vapi returned ${response.status}.`)
  const payload = await response.json()
  const calls = Array.isArray(payload) ? payload : payload.results || payload.calls || []
  if (calls.length < 100 || depth >= MAX_WINDOW_DEPTH || end - start < 60_000) return calls
  const middle = new Date((start.getTime() + end.getTime()) / 2)
  const [older, newer] = await Promise.all([fetchWindow(apiKey, start, middle, depth + 1), fetchWindow(apiKey, middle, end, depth + 1)])
  return [...older, ...newer]
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed.' })
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: 'Database configuration is unavailable.' })
  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  const cronAuthorized = req.method === 'GET' && process.env.CRON_SECRET && req.headers.authorization === `Bearer ${process.env.CRON_SECRET}`
  if (!cronAuthorized && !(await isAdmin(req, db))) return res.status(403).json({ error: 'Administrator access is required.' })
  if (!process.env.VAPI_PRIVATE_KEY) return res.status(503).json({ error: 'Vapi read-only synchronization needs VAPI_PRIVATE_KEY in Vercel.' })

  try {
    const now = new Date()
    const recentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const requestedStart = req.method === 'POST' && req.body?.full ? new Date(EARLIEST_SYNC) : recentStart
    const start = requestedStart < new Date(EARLIEST_SYNC) ? new Date(EARLIEST_SYNC) : requestedStart
    const calls = await fetchWindow(process.env.VAPI_PRIVATE_KEY, start, now)
    const rows = [...new Map(calls.filter((call) => call?.id).map((call) => [call.id, mapVapiCall(call)])).values()]
    for (let index = 0; index < rows.length; index += 100) {
      const { error } = await db.from('vapi_calls').upsert(rows.slice(index, index + 100), { onConflict: 'id' })
      if (error) throw error
    }
    const { count: removedBeforeBaseline, error: cleanupError } = await db
      .from('vapi_calls')
      .delete({ count: 'exact' })
      .lt('started_at', EARLIEST_SYNC)
    if (cleanupError) throw cleanupError
    return res.status(200).json({ success: true, fetched: calls.length, synchronized: rows.length, removedBeforeBaseline, from: start.toISOString(), through: now.toISOString() })
  } catch (error) {
    console.error('Vapi synchronization failed:', error)
    return res.status(502).json({ error: error.message || 'Vapi synchronization failed.' })
  }
}
