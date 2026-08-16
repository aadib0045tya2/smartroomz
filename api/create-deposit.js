import { createClient } from '@supabase/supabase-js'
import { SquareClient, SquareEnvironment } from 'square'
import { ensureCustomerAccount } from '../server/customerAccounts.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' })
  const { sourceId, propertyId, name, email, phone, idempotencyKey } = req.body || {}
  if (!sourceId || !propertyId || !name || !/^\S+@\S+\.\S+$/.test(email || '') || String(phone || '').replace(/\D/g, '').length < 10 || !idempotencyKey) {
    return res.status(400).json({ error: 'Missing or invalid payment details.' })
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY || !process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID) {
    return res.status(503).json({ error: 'Payment setup is not complete yet.' })
  }

  const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
  const { data: property } = await db.from('properties').select('id,title,status,hold_deposit_cents').eq('id', propertyId).single()
  if (!property || property.status !== 'published') return res.status(409).json({ error: 'This room is no longer available.' })
  const amountCents = Number(property.hold_deposit_cents)
  if (!Number.isInteger(amountCents) || amountCents <= 0 || amountCents > 1000000) return res.status(409).json({ error: 'This room has an invalid deposit amount. Please contact us.' })

  await db.from('room_holds').update({ active: false, status: 'expired' }).eq('status', 'pending').eq('active', true).lt('expires_at', new Date().toISOString())
  const { data: hold, error: holdError } = await db.from('room_holds').insert({
    property_id: property.id, property_title: property.title, customer_name: name.trim(), email: email.trim().toLowerCase(),
    phone: phone.trim(), amount_cents: amountCents, idempotency_key: idempotencyKey,
  }).select().single()
  if (holdError) return res.status(409).json({ error: holdError.code === '23505' ? 'This room is already being held. Please choose another room or call us.' : 'Could not start the room hold.' })

  try {
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    })
    const response = await client.payments.create({
      sourceId, idempotencyKey, locationId: process.env.SQUARE_LOCATION_ID,
      amountMoney: { amount: BigInt(amountCents), currency: 'USD' },
      referenceId: hold.id, note: `Smart Roomz $${(amountCents / 100).toFixed(2)} hold: ${property.title}`,
      buyerEmailAddress: email.trim().toLowerCase(),
    })
    const payment = response.payment
    if (!payment?.id || payment.status !== 'COMPLETED') throw new Error('Square did not complete the payment.')
    let customerId = null
    try { customerId = await ensureCustomerAccount(db, email, name) } catch (accountError) { console.error('Customer provisioning failed:', accountError.message) }
    await db.from('room_holds').update({ customer_id: customerId, status: 'paid', square_payment_id: payment.id, expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString() }).eq('id', hold.id)
    await db.from('payments').upsert({ hold_id: hold.id, square_payment_id: payment.id, amount_cents: amountCents, currency: 'USD', status: payment.status, receipt_url: payment.receiptUrl })
    await db.from('properties').update({ status: 'held', availability: 'Held' }).eq('id', property.id)
    return res.status(200).json({ success: true, holdId: hold.id, amountCents, receiptUrl: payment.receiptUrl || null, accountReady: Boolean(customerId) })
  } catch (error) {
    await db.from('room_holds').update({ status: 'failed', active: false }).eq('id', hold.id)
    const detail = error?.body?.errors?.[0]?.detail
    return res.status(402).json({ error: detail || error.message || 'Square declined the payment.' })
  }
}
