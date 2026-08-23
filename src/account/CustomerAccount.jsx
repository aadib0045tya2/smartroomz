import { CalendarDays, Home, LogOut, Mail, PhoneCall } from 'lucide-react'
import { useEffect, useState } from 'react'
import Brand from '../components/Brand.jsx'
import { hasSupabase, supabase } from '../lib/supabase.js'

const money = (cents) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(cents || 0) / 100)
const date = (value) => value ? new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(value)) : 'Not set'

export default function CustomerAccount() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!hasSupabase) return <AccountLayout><Notice title="Account setup is incomplete" text="Connect Supabase to enable customer accounts." /></AccountLayout>
  if (checking) return <AccountLayout><Notice title="Opening your account…" text="Checking your secure session." /></AccountLayout>
  return <AccountLayout>{session ? <Dashboard session={session} /> : <OtpLogin />}</AccountLayout>
}

function AccountLayout({ children }) {
  return <div className="customer-account"><header><Brand onClick={() => { window.location.href = '/' }} /><a href="/">Browse rooms</a></header><main>{children}</main></div>
}

function Notice({ title, text }) {
  return <section className="account-auth-card"><p className="eyebrow">Smart Roomz account</p><h1>{title}</h1><p>{text}</p></section>
}

function OtpLogin() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const sendCode = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    const normalized = email.trim().toLowerCase()
    const { error } = await supabase.auth.signInWithOtp({ email: normalized, options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/account` } })
    setBusy(false)
    if (error) return setMessage(error.message)
    setEmail(normalized); setStep('code'); setMessage('We sent a secure sign-in email. Open its one-time link, or enter the 6-digit code if one is shown.')
  }

  const verifyCode = async (event) => {
    event.preventDefault(); setBusy(true); setMessage('')
    const { error } = await supabase.auth.verifyOtp({ email, token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setMessage(error.message)
  }

  return <section className="account-auth-card">
    <div className="account-icon"><Mail /></div><p className="eyebrow">Password-free login</p><h1>See your Smart Roomz activity</h1>
    <p>Use the same email you entered for your deposit or call request. We’ll email you a one-time sign-in—no password needed.</p>
    {step === 'email' ? <form onSubmit={sendCode}><label className="field"><span>Email address</span><input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><button className="primary-button wide" disabled={busy}>{busy ? 'Sending…' : 'Email my secure login'}</button></form> : <form onSubmit={verifyCode}><label className="field"><span>6-digit code</span><input className="otp-input" required inputMode="numeric" autoComplete="one-time-code" maxLength="6" pattern="[0-9]{6}" value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="000000" /></label><button className="primary-button wide" disabled={busy || code.length !== 6}>{busy ? 'Checking…' : 'Open my account'}</button><button type="button" className="text-button" onClick={() => { setStep('email'); setCode(''); setMessage('') }}>Use a different email</button></form>}
    {message && <p className={message.startsWith('We sent') ? 'account-message success' : 'account-message'}>{message}</p>}
  </section>
}

function Dashboard({ session }) {
  const [records, setRecords] = useState({ holds: [], calls: [], applications: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('room_holds').select('*, payments(*)').order('created_at', { ascending: false }),
      supabase.from('call_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
    ]).then(([holds, calls, applications]) => {
      if (!active) return
      const firstError = holds.error || calls.error || applications.error
      if (firstError) setError(firstError.message)
      else setRecords({ holds: holds.data || [], calls: calls.data || [], applications: applications.data || [] })
      setLoading(false)
    })
    return () => { active = false }
  }, [])

  return <div className="account-dashboard">
    <div className="account-dashboard-title"><div><p className="eyebrow">My account</p><h1>Your room activity</h1><p>{session.user.email}</p></div><button className="secondary-button" onClick={() => supabase.auth.signOut()}><LogOut size={15} /> Sign out</button></div>
    <div className="account-stats"><article><Home /><div><strong>{records.holds.length}</strong><span>Room holds</span></div></article><article><PhoneCall /><div><strong>{records.calls.length}</strong><span>Call requests</span></div></article><article><CalendarDays /><div><strong>{records.applications.length}</strong><span>Applications</span></div></article></div>
    {loading && <p className="account-loading">Loading your activity…</p>}
    {error && <p className="account-message">We couldn’t load your activity: {error}</p>}
    {!loading && !error && <div className="account-sections">
      <RecordSection icon={<Home />} title="Room holds" empty="Your paid room holds will appear here.">{records.holds.map((hold) => <article className="customer-record" key={hold.id}><div><span className={`status-pill ${hold.status}`}>{hold.status}</span><h3>{hold.property_title}</h3><p>Paid {date(hold.created_at)} · Hold expires {date(hold.expires_at)}</p></div><div className="record-meta"><strong>{money(hold.amount_cents)}</strong>{hold.payments?.[0]?.receipt_url && <a href={hold.payments[0].receipt_url} target="_blank" rel="noreferrer">Square receipt</a>}</div></article>)}</RecordSection>
      <RecordSection icon={<PhoneCall />} title="Call requests" empty="Your call requests will appear here.">{records.calls.map((call) => <article className="customer-record" key={call.id}><div><span className={`status-pill ${call.status}`}>{call.status}</span><h3>{call.property_title}</h3><p>Preferred move-in {date(call.move_in_date)} · Requested {date(call.created_at)}</p>{call.message && <p>{call.message}</p>}</div></article>)}</RecordSection>
      <RecordSection icon={<CalendarDays />} title="Applications" empty="Your submitted applications will appear here.">{records.applications.map((application) => <article className="customer-record" key={application.id}><div><span className={`status-pill ${application.status}`}>{application.status}</span><h3>{application.property_title}</h3><p>Move-in {date(application.move_in_date)} · Submitted {date(application.created_at)}</p></div></article>)}</RecordSection>
    </div>}
  </div>
}

function RecordSection({ icon, title, empty, children }) {
  return <section className="account-record-section"><header><span>{icon}</span><h2>{title}</h2></header>{children.length ? <div className="account-record-list">{children}</div> : <p className="record-empty">{empty}</p>}</section>
}
