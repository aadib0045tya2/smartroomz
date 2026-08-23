import { createClient } from '@supabase/supabase-js'
import { ensureCustomerAccount } from '../server/customerAccounts.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  const { propertyId, name, phone, email, moveInDate, message } = req.body || {}
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!propertyId || !String(name || '').trim() || !/^\S+@\S+\.\S+$/.test(normalizedEmail) || String(phone || '').replace(/\D/g, '').length < 10 || !/^\d{4}-\d{2}-\d{2}$/.test(moveInDate || '')) {
    return res.status(400).json({ error: 'Missing or invalid call-request details.' })
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).json({ error: 'Account setup is unavailable.' })

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  const { data: property } = await db.from('properties').select('id,title').eq('id', propertyId).maybeSingle()
  if (!property) return res.status(404).json({ error: 'The selected room could not be found.' })

  let customerId = null
  try { customerId = await ensureCustomerAccount(db, normalizedEmail, name) } catch (error) { console.error('Customer provisioning failed:', error.message) }
  const { data, error } = await db.from('call_requests').insert({
    customer_id: customerId, property_id: property.id, property_title: property.title,
    name: String(name).trim(), phone: String(phone).trim(), email: normalizedEmail,
    move_in_date: moveInDate, message: String(message || '').trim() || null, status: 'new',
  }).select('id').single()
  if (error) return res.status(500).json({ error: 'Your request could not be saved. Please try again.' })
  return res.status(200).json({ success: true, requestId: data.id, accountReady: Boolean(customerId) })
}
