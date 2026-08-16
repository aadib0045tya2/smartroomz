import { ArrowLeft, Building2, CalendarClock, CreditCard, LogOut, Mail, Pencil, PhoneCall, Plus, RefreshCcw, Save, Trash2, UserPlus, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Brand from '../components/Brand.jsx'
import { fromPropertyRow, supabase, toPropertyRow } from '../lib/supabase.js'

const blankProperty = {
  id: '', title: '', area: '', city: 'Atlanta', state: 'GA', zip: '', images: [], weeklyPrice: 200, biweeklyPrice: 400,
  monthlyPrice: 800, deposit: 175, holdDeposit: 175, applicationFee: 50, roomType: 'Private room', availability: 'Available now',
  earliestMoveInDate: '', amenities: [], description: '', rating: 5, featured: false, latitude: '', longitude: '', status: 'draft',
}

export default function AdminApp() {
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(Boolean(supabase))
  const [authorized, setAuthorized] = useState(false)
  const [passwordSetup, setPasswordSetup] = useState(new URLSearchParams(window.location.search).get('setup') === '1')
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, next) => { setSession(next); if (event === 'PASSWORD_RECOVERY') setPasswordSetup(true) })
    return () => data.subscription.unsubscribe()
  }, [])
  useEffect(() => {
    Promise.resolve().then(async () => {
      if (!session) { setAuthorized(false); setChecking(false); return }
      setChecking(true)
      const { data } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
      setAuthorized(data?.role === 'admin'); setChecking(false)
    })
  }, [session])
  if (checking) return <AdminLoading />
  if (session && passwordSetup) return <PasswordSetup onDone={() => { setPasswordSetup(false); window.history.replaceState({}, '', '/admin') }} />
  if (!session || !authorized) return <AdminLogin session={session} />
  return <Dashboard session={session} />
}

function AdminLoading() { return <div className="admin-auth"><Brand /><p>Loading secure admin panel…</p></div> }

function AdminLogin({ session }) {
  const [mode, setMode] = useState('signin')
  const [form, setForm] = useState({ email: 'smartroomzusa@gmail.com', password: '' })
  const [message, setMessage] = useState(session ? 'This account is not authorized as an administrator.' : '')
  const submit = async (event) => {
    event.preventDefault(); setMessage('Working…')
    if (mode === 'reset') {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email.trim().toLowerCase(), { redirectTo: 'https://smartroomz.vercel.app/admin' })
      setMessage(error ? error.message : 'If that admin email exists, a password-reset link is on the way.')
      return
    }
    const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
    setMessage(error ? error.message : '')
  }
  return <main className="admin-auth"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to website</a><Brand />
    <section><p className="eyebrow">Authorized team only</p><h1>Smart Roomz admin</h1><p>Manage listings, leads, calls, and paid room holds.</p>
      <form onSubmit={submit}><label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>{mode === 'signin' && <label className="field"><span>Password</span><input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>}<button className="primary-button wide">{mode === 'signin' ? 'Sign in' : 'Email password-reset link'}</button></form>
      {message && <p className="admin-message">{message}</p>}
      <button className="text-button" onClick={() => { setMode(mode === 'signin' ? 'reset' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'Forgot password?' : 'Back to sign in'}</button>
      {session && <button className="text-button" onClick={() => supabase.auth.signOut()}>Sign out of this account</button>}
    </section>
  </main>
}

function PasswordSetup({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async (event) => {
    event.preventDefault()
    if (password.length < 8) return setMessage('Use at least 8 characters.')
    if (password !== confirm) return setMessage('The passwords do not match.')
    setSaving(true); setMessage('')
    const { error } = await supabase.auth.updateUser({ password })
    setSaving(false)
    if (error) setMessage(error.message)
    else onDone()
  }
  return <main className="admin-auth"><Brand /><section><p className="eyebrow">Secure admin access</p><h1>Choose your password</h1><p>Create a password for your invitation or replace the password you forgot.</p><form onSubmit={submit}><label className="field"><span>New password</span><input type="password" minLength="8" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><label className="field"><span>Confirm new password</span><input type="password" minLength="8" autoComplete="new-password" value={confirm} onChange={(event) => setConfirm(event.target.value)} required /></label><button className="primary-button wide" disabled={saving}>{saving ? 'Saving…' : 'Save password'}</button></form>{message && <p className="admin-message">{message}</p>}</section></main>
}

function Dashboard({ session }) {
  const [tab, setTab] = useState('listings')
  const [data, setData] = useState({ properties: [], applications: [], calls: [], holds: [], members: [] })
  const [editor, setEditor] = useState(null)
  const [message, setMessage] = useState('')
  const [republishingId, setRepublishingId] = useState('')
  const load = useCallback(async () => {
    const [properties, applications, calls, holds, membersResponse] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('call_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('room_holds').select('*').order('created_at', { ascending: false }),
      fetch('/api/admin-members', { headers: { Authorization: `Bearer ${session.access_token}` } }),
    ])
    const error = [properties, applications, calls, holds].find((result) => result.error)?.error
    if (error) setMessage(error.message)
    const membersResult = await membersResponse.json().catch(() => ({ members: [] }))
    if (!membersResponse.ok) setMessage(membersResult.error || 'Could not load team members.')
    setData({ properties: (properties.data || []).map(fromPropertyRow), applications: applications.data || [], calls: calls.data || [], holds: holds.data || [], members: membersResult.members || [] })
  }, [session.access_token])
  useEffect(() => { Promise.resolve().then(load) }, [load])
  const stats = useMemo(() => ({ available: data.properties.filter((p) => p.status === 'published').length, leads: data.applications.length + data.calls.length, calls: data.calls.filter((c) => c.status === 'new').length, deposits: data.holds.filter((h) => h.status === 'paid').reduce((sum, h) => sum + h.amount_cents, 0) / 100 }), [data])
  const updateStatus = async (table, id, status) => { const { error } = await supabase.from(table).update({ status }).eq('id', id); setMessage(error?.message || 'Updated.'); load() }
  const removeProperty = async (property) => { if (!window.confirm(`Delete ${property.title}? Existing lead and payment history will be preserved.`)) return; const { error } = await supabase.from('properties').delete().eq('id', property.id); setMessage(error?.message || 'Listing deleted.'); load() }
  const releaseHold = async (hold) => { if (!window.confirm('Release this room hold? This does not issue a Square refund.')) return; await supabase.from('room_holds').update({ status: 'canceled', active: false }).eq('id', hold.id); if (hold.property_id) await supabase.from('properties').update({ status: 'published', availability: 'Available now' }).eq('id', hold.property_id); setMessage('Hold released. Issue any refund separately in Square.'); load() }
  const republishProperty = async (property) => {
    setRepublishingId(property.id); setMessage('')
    const { error: holdError } = await supabase.from('room_holds').update({ status: 'canceled', active: false }).eq('property_id', property.id).eq('active', true)
    if (holdError) { setMessage(holdError.message); setRepublishingId(''); return }
    const { error: propertyError } = await supabase.from('properties').update({ status: 'published', availability: 'Available now' }).eq('id', property.id)
    setMessage(propertyError?.message || `${property.title} is published and available again.`)
    setRepublishingId(''); load()
  }
  return <div className="admin-shell">
    <header className="admin-header"><Brand /><div><span>{session.user.email}</span><a href="/"><ArrowLeft size={15} /> Website</a><button onClick={() => supabase.auth.signOut()}><LogOut size={15} /> Sign out</button></div></header>
    <main><div className="admin-title"><div><p className="eyebrow">Operations dashboard</p><h1>Welcome back</h1><p>Everything your team needs to manage rooms and renter interest.</p></div>{tab === 'listings' && <button className="primary-button" onClick={() => setEditor({ ...blankProperty })}><Plus size={16} /> Add listing</button>}</div>
      <section className="admin-stats"><Stat icon={Building2} label="Published rooms" value={stats.available} /><Stat icon={Users} label="Total leads" value={stats.leads} /><Stat icon={PhoneCall} label="New call requests" value={stats.calls} /><Stat icon={CreditCard} label="Paid deposits" value={`$${stats.deposits.toLocaleString()}`} /></section>
      <nav className="admin-tabs">{[['listings','Listings'],['applications','Applications'],['calls','Call requests'],['holds','Deposits & holds'],['members','Team members']].map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}<span>{data[key === 'listings' ? 'properties' : key].length}</span></button>)}</nav>
      {message && <div className="admin-banner">{message}<button onClick={() => setMessage('')}>×</button></div>}
      {tab === 'listings' && <Listings items={data.properties} onEdit={(p) => setEditor({ ...p })} onDelete={removeProperty} onRepublish={republishProperty} republishingId={republishingId} />}
      {tab === 'applications' && <Leads items={data.applications} type="applications" onStatus={(id, status) => updateStatus('applications', id, status)} />}
      {tab === 'calls' && <Leads items={data.calls} type="calls" onStatus={(id, status) => updateStatus('call_requests', id, status)} />}
      {tab === 'holds' && <Holds items={data.holds} onRelease={releaseHold} />}
      {tab === 'members' && <TeamMembers members={data.members} session={session} onAdded={(text) => { setMessage(text); load() }} />}
    </main>
    {editor && <PropertyEditor property={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setMessage('Listing saved.'); load() }} />}
  </div>
}

function TeamMembers({ members, session, onAdded }) {
  const [form, setForm] = useState({ fullName: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const submit = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    const response = await fetch('/api/admin-members', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify(form) })
    const result = await response.json()
    setSaving(false)
    if (!response.ok) return setError(result.error || 'Could not add this member.')
    setForm({ fullName: '', email: '' }); onAdded(result.message)
  }
  return <div className="team-management"><section><div className="team-heading"><span><UserPlus /></span><div><h2>Add an administrator</h2><p>They will receive a secure invitation and can manage listings, leads, calls, and deposits.</p></div></div><form className="team-form" onSubmit={submit}><label className="field"><span>Full name</span><input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Team member name" /></label><label className="field"><span>Email</span><input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="member@example.com" /></label><button className="primary-button" disabled={saving}><Mail size={15} /> {saving ? 'Sending…' : 'Send admin invitation'}</button>{error && <p className="admin-message">{error}</p>}</form></section><section><h2>Current administrators</h2><div className="member-list">{members.map((member) => <article key={member.id}><span><Users /></span><div><strong>{member.full_name || 'Smart Roomz administrator'}</strong><a href={`mailto:${member.email}`}>{member.email}</a></div><small>Admin</small></article>)}</div></section></div>
}

function Stat({ icon: Icon, label, value }) { return <article><Icon size={20} /><div><strong>{value}</strong><span>{label}</span></div></article> }

function Listings({ items, onEdit, onDelete, onRepublish, republishingId }) { return <div className="admin-grid">{items.map((item) => <article className="admin-listing" key={item.id}><img src={item.images[0] || '/smart-roomz-mascot.webp'} alt="" /><div><span className={`status-pill ${item.status}`}>{item.status}</span><h3>{item.title}</h3><p>{item.area}, {item.city} · ${item.weeklyPrice}/week · ${item.holdDeposit} hold</p></div><div className="row-actions">{item.status === 'held' && <button className="republish" disabled={republishingId === item.id} onClick={() => onRepublish(item)}><RefreshCcw size={15} /> {republishingId === item.id ? 'Publishing…' : 'Publish again'}</button>}<button onClick={() => onEdit(item)}><Pencil size={15} /> Edit</button><button className="danger" onClick={() => onDelete(item)}><Trash2 size={15} /> Delete</button></div></article>)}</div> }

function Leads({ items, type, onStatus }) {
  const statuses = type === 'calls' ? ['new','contacted','closed'] : ['submitted','contacted','qualified','payment','approved','moved_in','rejected']
  return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>{type === 'calls' ? 'Requester' : 'Applicant'}</th><th>Room</th><th>Contact</th><th>Move-in</th><th>Status</th><th>Received</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.applicant_name || item.name}</strong>{item.message && <small>{item.message}</small>}</td><td>{item.property_title || 'General inquiry'}</td><td><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.move_in_date || '—'}</td><td><select value={item.status} onChange={(e) => onStatus(item.id, e.target.value)}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></td><td>{new Date(item.created_at).toLocaleDateString()}</td></tr>)}</tbody></table>{!items.length && <Empty text="Nothing here yet." />}</div>
}

function Holds({ items, onRelease }) { return <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Customer</th><th>Room</th><th>Amount</th><th>Square payment</th><th>Status</th><th>Created</th><th /></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.customer_name}</strong><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></td><td>{item.property_title}</td><td>${(item.amount_cents / 100).toFixed(2)}</td><td><code>{item.square_payment_id || 'Pending'}</code></td><td><span className={`status-pill ${item.status}`}>{item.status}</span></td><td>{new Date(item.created_at).toLocaleString()}</td><td>{item.active && <button className="table-button" onClick={() => onRelease(item)}>Release</button>}</td></tr>)}</tbody></table>{!items.length && <Empty text="No deposits or holds yet." />}</div> }
function Empty({ text }) { return <div className="admin-empty"><CalendarClock size={28} /><p>{text}</p></div> }

function PropertyEditor({ property, onClose, onSaved }) {
  const [form, setForm] = useState(property)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const upload = async (files) => {
    setSaving(true); setMessage('Uploading images…')
    const urls = []
    for (const file of files) {
      const path = `${Date.now()}-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '-')}`
      const { error } = await supabase.storage.from('property-images').upload(path, file)
      if (error) { setMessage(error.message); setSaving(false); return }
      urls.push(supabase.storage.from('property-images').getPublicUrl(path).data.publicUrl)
    }
    update('images', [...form.images, ...urls]); setMessage(`${urls.length} image(s) uploaded.`); setSaving(false)
  }
  const save = async (event) => {
    event.preventDefault(); setSaving(true); setMessage('')
    if (!form.id || !form.title || !form.area || !form.zip || !form.images.length) { setMessage('ID, title, area, ZIP, and at least one image are required.'); setSaving(false); return }
    if (!Number.isFinite(Number(form.holdDeposit)) || Number(form.holdDeposit) < 0.01 || Number(form.holdDeposit) > 10000) { setMessage('Room-hold deposit must be between $0.01 and $10,000.'); setSaving(false); return }
    const { error } = await supabase.from('properties').upsert(toPropertyRow(form))
    setSaving(false); if (error) setMessage(error.message); else onSaved()
  }
  return <div className="admin-editor-backdrop"><form className="admin-editor" onSubmit={save}><header><div><p className="eyebrow">Listing editor</p><h2>{property.title || 'New room'}</h2></div><button type="button" onClick={onClose}>×</button></header><div className="editor-body">
    <div className="form-grid"><Field label="Listing ID (slug)" value={form.id} onChange={(v) => update('id', v)} disabled={Boolean(property.title)} /><Field label="Title" value={form.title} onChange={(v) => update('title', v)} /><Field label="Area" value={form.area} onChange={(v) => update('area', v)} /><Field label="City" value={form.city} onChange={(v) => update('city', v)} /><Field label="State" value={form.state} onChange={(v) => update('state', v)} /><Field label="ZIP" value={form.zip} onChange={(v) => update('zip', v)} /><Field type="number" label="Weekly price" value={form.weeklyPrice} onChange={(v) => update('weeklyPrice', v)} /><Field type="number" label="Bi-weekly price" value={form.biweeklyPrice} onChange={(v) => update('biweeklyPrice', v)} /><Field type="number" label="Monthly price" value={form.monthlyPrice} onChange={(v) => update('monthlyPrice', v)} /><Field type="number" min="0.01" max="10000" step="0.01" label="Room-hold deposit" value={form.holdDeposit} onChange={(v) => update('holdDeposit', v)} /><Field type="date" label="Earliest move-in" value={form.earliestMoveInDate || ''} onChange={(v) => update('earliestMoveInDate', v)} /></div>
    <div className="form-grid"><label className="field"><span>Status</span><select value={form.status} onChange={(e) => update('status', e.target.value)}><option>draft</option><option>published</option><option>held</option><option>unavailable</option></select></label><Field label="Availability label" value={form.availability} onChange={(v) => update('availability', v)} /><Field label="Room type" value={form.roomType} onChange={(v) => update('roomType', v)} /><Field type="number" label="Rating" value={form.rating} onChange={(v) => update('rating', v)} /></div>
    <label className="field"><span>Description</span><textarea value={form.description} onChange={(e) => update('description', e.target.value)} /></label><label className="field"><span>Amenities (comma separated)</span><input value={form.amenities.join(', ')} onChange={(e) => update('amenities', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} /></label>
    <label className="field"><span>Upload property images</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => upload([...e.target.files])} /></label><div className="editor-images">{form.images.map((url) => <div key={url}><img src={url} alt="" /><button type="button" onClick={() => update('images', form.images.filter((image) => image !== url))}>×</button></div>)}</div>
    <label className="check-row"><input type="checkbox" checked={form.featured} onChange={(e) => update('featured', e.target.checked)} /> Featured listing</label>{message && <p className="admin-message">{message}</p>}
  </div><footer><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}><Save size={15} /> {saving ? 'Saving…' : 'Save listing'}</button></footer></form></div>
}

function Field({ label, value, onChange, type = 'text', disabled = false, min, max, step }) { return <label className="field"><span>{label}</span><input type={type} value={value} disabled={disabled} min={min} max={max} step={step} onChange={(e) => onChange(e.target.value)} required /></label> }
