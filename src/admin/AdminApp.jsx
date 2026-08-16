import { ArrowLeft, Building2, CalendarClock, CreditCard, LogOut, Pencil, PhoneCall, Plus, Save, Trash2, Users } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
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
    const action = mode === 'signin' ? supabase.auth.signInWithPassword({ email: form.email, password: form.password }) : supabase.auth.signUp({ email: form.email, password: form.password })
    const { error } = await action
    setMessage(error ? error.message : mode === 'signup' ? 'Account created. Check your email if confirmation is enabled, then sign in.' : '')
  }
  return <main className="admin-auth"><a className="admin-back" href="/"><ArrowLeft size={15} /> Back to website</a><Brand />
    <section><p className="eyebrow">Authorized team only</p><h1>Smart Roomz admin</h1><p>Manage listings, leads, calls, and paid room holds.</p>
      <form onSubmit={submit}><label className="field"><span>Email</span><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label><label className="field"><span>Password</span><input type="password" minLength="8" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label><button className="primary-button wide">{mode === 'signin' ? 'Sign in' : 'Create admin account'}</button></form>
      {message && <p className="admin-message">{message}</p>}
      <button className="text-button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'First time? Create the authorized account' : 'Already have an account? Sign in'}</button>
      {session && <button className="text-button" onClick={() => supabase.auth.signOut()}>Sign out of this account</button>}
    </section>
  </main>
}

function Dashboard({ session }) {
  const [tab, setTab] = useState('listings')
  const [data, setData] = useState({ properties: [], applications: [], calls: [], holds: [] })
  const [editor, setEditor] = useState(null)
  const [message, setMessage] = useState('')
  const load = async () => {
    const [properties, applications, calls, holds] = await Promise.all([
      supabase.from('properties').select('*').order('created_at', { ascending: false }),
      supabase.from('applications').select('*').order('created_at', { ascending: false }),
      supabase.from('call_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('room_holds').select('*').order('created_at', { ascending: false }),
    ])
    const error = [properties, applications, calls, holds].find((result) => result.error)?.error
    if (error) setMessage(error.message)
    setData({ properties: (properties.data || []).map(fromPropertyRow), applications: applications.data || [], calls: calls.data || [], holds: holds.data || [] })
  }
  useEffect(() => { Promise.resolve().then(load) }, [])
  const stats = useMemo(() => ({ available: data.properties.filter((p) => p.status === 'published').length, leads: data.applications.length + data.calls.length, calls: data.calls.filter((c) => c.status === 'new').length, deposits: data.holds.filter((h) => h.status === 'paid').reduce((sum, h) => sum + h.amount_cents, 0) / 100 }), [data])
  const updateStatus = async (table, id, status) => { const { error } = await supabase.from(table).update({ status }).eq('id', id); setMessage(error?.message || 'Updated.'); load() }
  const removeProperty = async (property) => { if (!window.confirm(`Delete ${property.title}? Existing lead and payment history will be preserved.`)) return; const { error } = await supabase.from('properties').delete().eq('id', property.id); setMessage(error?.message || 'Listing deleted.'); load() }
  const releaseHold = async (hold) => { if (!window.confirm('Release this room hold? This does not issue a Square refund.')) return; await supabase.from('room_holds').update({ status: 'canceled', active: false }).eq('id', hold.id); if (hold.property_id) await supabase.from('properties').update({ status: 'published', availability: 'Available now' }).eq('id', hold.property_id); setMessage('Hold released. Issue any refund separately in Square.'); load() }
  return <div className="admin-shell">
    <header className="admin-header"><Brand /><div><span>{session.user.email}</span><a href="/"><ArrowLeft size={15} /> Website</a><button onClick={() => supabase.auth.signOut()}><LogOut size={15} /> Sign out</button></div></header>
    <main><div className="admin-title"><div><p className="eyebrow">Operations dashboard</p><h1>Welcome back</h1><p>Everything your team needs to manage rooms and renter interest.</p></div>{tab === 'listings' && <button className="primary-button" onClick={() => setEditor({ ...blankProperty })}><Plus size={16} /> Add listing</button>}</div>
      <section className="admin-stats"><Stat icon={Building2} label="Published rooms" value={stats.available} /><Stat icon={Users} label="Total leads" value={stats.leads} /><Stat icon={PhoneCall} label="New call requests" value={stats.calls} /><Stat icon={CreditCard} label="Paid deposits" value={`$${stats.deposits.toLocaleString()}`} /></section>
      <nav className="admin-tabs">{[['listings','Listings'],['applications','Applications'],['calls','Call requests'],['holds','Deposits & holds']].map(([key,label]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>{label}<span>{data[key === 'listings' ? 'properties' : key].length}</span></button>)}</nav>
      {message && <div className="admin-banner">{message}<button onClick={() => setMessage('')}>×</button></div>}
      {tab === 'listings' && <Listings items={data.properties} onEdit={(p) => setEditor({ ...p })} onDelete={removeProperty} />}
      {tab === 'applications' && <Leads items={data.applications} type="applications" onStatus={(id, status) => updateStatus('applications', id, status)} />}
      {tab === 'calls' && <Leads items={data.calls} type="calls" onStatus={(id, status) => updateStatus('call_requests', id, status)} />}
      {tab === 'holds' && <Holds items={data.holds} onRelease={releaseHold} />}
    </main>
    {editor && <PropertyEditor property={editor} onClose={() => setEditor(null)} onSaved={() => { setEditor(null); setMessage('Listing saved.'); load() }} />}
  </div>
}

function Stat({ icon: Icon, label, value }) { return <article><Icon size={20} /><div><strong>{value}</strong><span>{label}</span></div></article> }

function Listings({ items, onEdit, onDelete }) { return <div className="admin-grid">{items.map((item) => <article className="admin-listing" key={item.id}><img src={item.images[0] || '/smart-roomz-mascot.webp'} alt="" /><div><span className={`status-pill ${item.status}`}>{item.status}</span><h3>{item.title}</h3><p>{item.area}, {item.city} · ${item.weeklyPrice}/week · ${item.holdDeposit} hold</p></div><div className="row-actions"><button onClick={() => onEdit(item)}><Pencil size={15} /> Edit</button><button className="danger" onClick={() => onDelete(item)}><Trash2 size={15} /> Delete</button></div></article>)}</div> }

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
