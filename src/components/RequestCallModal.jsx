import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal.jsx'

export default function RequestCallModal({ property, moveInDate = '', properties, onSubmit, onClose }) {
  const [sent, setSent] = useState(false)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({ name: '', phone: '', email: '', propertyId: property?.id || properties[0].id, moveInDate, message: '' })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    for (const key of ['name', 'phone', 'email', 'propertyId', 'moveInDate']) if (!form[key]) nextErrors[key] = 'Required'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email'
    if (form.phone && form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Enter a valid phone number'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) return
    setSaving(true); setSubmitError('')
    try { await onSubmit({ id: `call-${Date.now()}`, ...form, createdAt: new Date().toISOString() }); setSent(true) }
    catch (error) { setSubmitError(error.message || 'Could not send your request. Please try again.') }
    finally { setSaving(false) }
  }
  return <Modal onClose={onClose} className="form-modal" label="Request a call">{sent ? <div className="success-state"><CheckCircle2 size={50} /><p className="eyebrow">Request received</p><h2>We’ve got your details.</h2><p>Your request was sent to the Smart Roomz team. We also created your customer account—use this email to request a one-time login code and track your room activity.</p><a className="primary-button receipt-link" href="/account">Open my account</a><button className="secondary-button" onClick={onClose}>Done</button></div> : <><p className="eyebrow">Talk to a housing specialist</p><h2>Request a call</h2><p className="form-intro">Tell us what you’re looking for and the best way to reach you.</p><form onSubmit={submit} className="form-stack"><Field label="Name" value={form.name} error={errors.name} onChange={(v) => update('name', v)} /><Field type="tel" label="Phone" value={form.phone} error={errors.phone} onChange={(v) => update('phone', v)} /><Field type="email" label="Email" value={form.email} error={errors.email} onChange={(v) => update('email', v)} /><label className="field"><span>Property</span><select value={form.propertyId} onChange={(e) => update('propertyId', e.target.value)}>{properties.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><Field type="date" label="Preferred move-in date" value={form.moveInDate} error={errors.moveInDate} onChange={(v) => update('moveInDate', v)} /><label className="field"><span>Optional message</span><textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Anything we should know?" /></label>{submitError && <p className="form-error">{submitError}</p>}<button className="primary-button wide" disabled={saving} type="submit">{saving ? 'Sending…' : 'Request my call'}</button></form></>}</Modal>
}

function Field({ label, value, onChange, error, type = 'text' }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />{error && <small>{error}</small>}</label>
}
