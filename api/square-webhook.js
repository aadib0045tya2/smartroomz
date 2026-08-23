import { createClient } from '@supabase/supabase-js'
import { WebhooksHelper } from 'square'

export const config = { api: { bodyParser: false } }

async function rawBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(Buffer.from(chunk))
  return Buffer.concat(chunks).toString('utf8')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || !process.env.SQUARE_WEBHOOK_URL || !process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return res.status(503).end()
  const body = await rawBody(req)
  const valid = await WebhooksHelper.verifySignature({
    requestBody: body,
    signatureHeader: req.headers['x-square-hmacsha256-signature'] || '',
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
    notificationUrl: process.env.SQUARE_WEBHOOK_URL,
  })
  if (!valid) return res.status(403).end()
  const event = JSON.parse(body)
  const payment = event?.data?.object?.payment
  if (payment?.id) {
    const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY, { auth: { persistSession: false } })
    const holdStatus = payment.status === 'COMPLETED' ? 'paid' : payment.status === 'CANCELED' || payment.status === 'FAILED' ? 'failed' : 'pending'
    await db.from('room_holds').update({ status: holdStatus, active: holdStatus === 'paid' || holdStatus === 'pending' }).eq('square_payment_id', payment.id)
    await db.from('payments').update({ status: payment.status, receipt_url: payment.receipt_url || null }).eq('square_payment_id', payment.id)
  }
  return res.status(200).json({ received: true })
}
