import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal.jsx'
import PriceSummary from './PriceSummary.jsx'
import { getPriceSummary, money, planLabel } from '../utils/pricing.js'

export default function ApplicationModal({ context, onSubmit, onClose }) {
  const [step, setStep] = useState(1)
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', roomPreference: context.property.roomType, moveInDate: context.moveInDate, paymentPlan: context.plan })
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const validate = () => {
    const required = step === 1 ? ['firstName', 'lastName', 'email', 'phone'] : ['roomPreference', 'moveInDate', 'paymentPlan']
    const nextErrors = Object.fromEntries(required.filter((key) => !String(form[key]).trim()).map((key) => [key, 'Required']))
    if (step === 1 && form.email && !/^\S+@\S+\.\S+$/.test(form.email)) nextErrors.email = 'Enter a valid email'
    if (step === 1 && form.phone && form.phone.replace(/\D/g, '').length < 10) nextErrors.phone = 'Enter a valid phone number'
    setErrors(nextErrors)
    return !Object.keys(nextErrors).length
  }
  const next = () => validate() && setStep((current) => Math.min(3, current + 1))
  const submit = () => {
    const pricing = getPriceSummary(context.property, form.paymentPlan)
    onSubmit({ id: `app-${Date.now()}`, propertyId: context.property.id, property: context.property.title, applicant: `${form.firstName} ${form.lastName}`, ...form, estimatedAmount: pricing.total, status: 'Submitted', submittedAt: new Date().toISOString() })
    setSubmitted(true)
  }
  if (submitted) return <Modal onClose={onClose} className="form-modal" label="Application submitted"><div className="success-state"><CheckCircle2 size={50} /><p className="eyebrow">Application received</p><h2>You’re one step closer.</h2><p>Your application was saved on this device. A Smart Roomz specialist would normally contact you next.</p><button className="primary-button" onClick={onClose}>Done</button></div></Modal>
  return (
    <Modal onClose={onClose} className="form-modal" label="Room application">
      <p className="eyebrow">Step {step} of 3</p><h2>{step === 1 ? 'Tell us about yourself' : step === 2 ? 'Plan your move' : 'Review your application'}</h2>
      <div className="progress" aria-label={`Step ${step} of 3`}>{[1, 2, 3].map((item) => <span key={item} className={item <= step ? 'active' : ''} />)}</div>
      {step === 1 && <div className="form-grid"><Field label="First name" value={form.firstName} error={errors.firstName} onChange={(v) => update('firstName', v)} /><Field label="Last name" value={form.lastName} error={errors.lastName} onChange={(v) => update('lastName', v)} /><Field type="email" label="Email" value={form.email} error={errors.email} onChange={(v) => update('email', v)} /><Field type="tel" label="Phone" value={form.phone} error={errors.phone} onChange={(v) => update('phone', v)} /></div>}
      {step === 2 && <div className="form-stack"><label className="field"><span>Selected property</span><input value={context.property.title} disabled /></label><label className="field"><span>Room preference</span><select value={form.roomPreference} onChange={(e) => update('roomPreference', e.target.value)}><option>Private room</option><option>Private suite</option></select></label><label className="field"><span>Move-in date</span><input type="date" min={context.property.earliestMoveInDate} value={form.moveInDate} onChange={(e) => update('moveInDate', e.target.value)} /></label><label className="field"><span>Payment frequency</span><select value={form.paymentPlan} onChange={(e) => update('paymentPlan', e.target.value)}><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option></select></label></div>}
      {step === 3 && <div><div className="review-card"><div><span>Applicant</span><b>{form.firstName} {form.lastName}</b></div><div><span>Property</span><b>{context.property.title}</b></div><div><span>Move-in</span><b>{new Date(`${form.moveInDate}T12:00:00`).toLocaleDateString()}</b></div><div><span>Payment plan</span><b>{planLabel(form.paymentPlan)}</b></div><div><span>Contact</span><b>{form.email} · {form.phone}</b></div></div><PriceSummary property={context.property} plan={form.paymentPlan} /><p className="review-note">Estimated amount due to move in: <strong>{money(getPriceSummary(context.property, form.paymentPlan).total)}</strong></p></div>}
      <div className="modal-nav">{step > 1 ? <button className="secondary-button" onClick={() => setStep(step - 1)}>Back</button> : <span />}{step < 3 ? <button className="primary-button" onClick={next}>Continue</button> : <button className="primary-button" onClick={submit}>Submit application</button>}</div>
    </Modal>
  )
}

function Field({ label, value, onChange, error, type = 'text' }) {
  return <label className="field"><span>{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} />{error && <small>{error}</small>}</label>
}
