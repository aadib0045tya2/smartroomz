import { CheckCircle2, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Modal from './Modal.jsx'

const appId = import.meta.env.VITE_SQUARE_APP_ID
const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID
const environment = import.meta.env.VITE_SQUARE_ENVIRONMENT || 'sandbox'
const configured = Boolean(appId && locationId)

function loadSquare() {
  if (window.Square) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = environment === 'production' ? 'https://web.squarecdn.com/v1/square.js' : 'https://sandbox.web.squarecdn.com/v1/square.js'
    script.onload = resolve
    script.onerror = () => reject(new Error('Square payment form could not be loaded.'))
    document.head.appendChild(script)
  })
}

export default function DepositModal({ property, onClose }) {
  const cardRef = useRef(null)
  const [card, setCard] = useState(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [status, setStatus] = useState(configured ? 'loading' : 'unconfigured')
  const [message, setMessage] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    if (!configured) return
    let active = true
    let paymentCard
    loadSquare().then(async () => {
      const payments = window.Square.payments(appId, locationId)
      paymentCard = await payments.card()
      await paymentCard.attach(cardRef.current)
      if (active) { setCard(paymentCard); setStatus('ready') }
    }).catch((error) => { if (active) { setMessage(error.message); setStatus('error') } })
    return () => { active = false; paymentCard?.destroy?.() }
  }, [])

  const submit = async (event) => {
    event.preventDefault()
    if (!form.name || !/^\S+@\S+\.\S+$/.test(form.email) || form.phone.replace(/\D/g, '').length < 10) {
      setMessage('Enter your name, a valid email, and a valid phone number.')
      return
    }
    setStatus('processing'); setMessage('')
    try {
      const tokenResult = await card.tokenize({
        amount: '175.00', currencyCode: 'USD', intent: 'CHARGE', customerInitiated: true,
        sellerKeyedIn: false, billingContact: { givenName: form.name, email: form.email, phone: form.phone },
      })
      if (tokenResult.status !== 'OK') throw new Error(tokenResult.errors?.[0]?.message || 'Card details could not be verified.')
      const response = await fetch('/api/create-deposit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceId: tokenResult.token, propertyId: property.id, ...form, idempotencyKey: crypto.randomUUID() }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Payment could not be completed.')
      setStatus('paid'); setMessage(result.receiptUrl || '')
    } catch (error) { setMessage(error.message); setStatus('ready') }
  }

  return <Modal onClose={onClose} className="form-modal deposit-modal" label="Hold room deposit">
    {status === 'paid' ? <div className="success-state"><CheckCircle2 size={50} /><p className="eyebrow">Room held</p><h2>Your $175 deposit was received.</h2><p>We’ll contact you with the next steps. Keep your Square receipt for your records.</p>{message && <a className="primary-button receipt-link" href={message} target="_blank" rel="noreferrer">View receipt</a>}<button className="secondary-button" onClick={onClose}>Done</button></div> : <>
      <p className="eyebrow">Secure room hold</p><h2>Hold {property.title} for $175</h2>
      <p className="form-intro">The amount is fixed on our server and processed securely by Square. Your card details never pass through Smart Roomz servers.</p>
      <form className="form-stack" onSubmit={submit}>
        <label className="field"><span>Full name</span><input value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
        <label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></label>
        <label className="field"><span>Phone</span><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></label>
        {status === 'unconfigured' ? <div className="setup-notice"><strong>Square setup is the last step.</strong><span>Add the Square sandbox credentials in Vercel to enable card entry.</span></div> : <div className="square-card-wrap"><span>Card details</span><div ref={cardRef} id="square-card" /></div>}
        {message && status !== 'unconfigured' && <p className="form-error">{message}</p>}
        <button className="primary-button wide" disabled={status !== 'ready'}>{status === 'processing' ? 'Processing…' : status === 'loading' ? 'Loading secure payment…' : 'Pay $175 and hold room'}</button>
        <p className="secure-note"><ShieldCheck size={14} /> Secure payment powered by Square</p>
      </form>
    </>}
  </Modal>
}
