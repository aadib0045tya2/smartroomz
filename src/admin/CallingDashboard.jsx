import { CalendarCheck, DollarSign, PhoneCall, RefreshCcw, Route, Users, X } from 'lucide-react'
import { useMemo, useState } from 'react'

const OUTCOMES = {
  appointment_booked: 'Appointment booked',
  not_interested: 'Marked not interested',
  incomplete_technical: 'Incomplete / technical',
  callback_requested: 'Callback requested',
  interested_not_booked: 'Interested, not booked',
  transferred: 'Live transferred',
  other_unclear: 'Other / unclear',
}

const COLORS = {
  appointment_booked: '#17865f', not_interested: '#dc6d5e', incomplete_technical: '#8290a0',
  callback_requested: '#e0a32f', interested_not_booked: '#5c79c9', transferred: '#8d63bd', other_unclear: '#a5a5a0',
}

function formatDuration(seconds) {
  const value = Number(seconds || 0)
  return `${Math.floor(value / 60)}m ${value % 60}s`
}

function shortPhone(value) {
  if (!value) return 'Unknown caller'
  return value.startsWith('+1') && value.length === 12 ? `(${value.slice(2, 5)}) ${value.slice(5, 8)}-${value.slice(8)}` : value
}

export default function CallingDashboard({ calls, session, onReload, onMessage }) {
  const [range, setRange] = useState('30')
  const [audience, setAudience] = useState('clients')
  const [outcome, setOutcome] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [selected, setSelected] = useState(null)
  const [renderedAt] = useState(() => Date.now())
  const filtered = useMemo(() => {
    const cutoff = range === 'all' ? 0 : renderedAt - Number(range) * 86400000
    return calls.filter((call) => (!cutoff || new Date(call.started_at).getTime() >= cutoff)
      && (audience === 'all' || (audience === 'tests' ? call.is_test : !call.is_test))
      && (outcome === 'all' || call.reviewed_category === outcome))
  }, [calls, range, audience, outcome, renderedAt])

  const metrics = useMemo(() => {
    const unique = new Set(filtered.map((call) => call.caller_number).filter(Boolean)).size
    const booked = filtered.filter((call) => call.appointment_booked).length
    return {
      calls: filtered.length, unique, booked,
      rate: filtered.length ? (booked / filtered.length) * 100 : 0,
      transferred: filtered.filter((call) => call.transferred_to_dossy).length,
      cost: filtered.reduce((sum, call) => sum + Number(call.cost || 0), 0),
    }
  }, [filtered])

  const outcomeCounts = useMemo(() => Object.keys(OUTCOMES).map((key) => ({ key, count: filtered.filter((call) => call.reviewed_category === key).length })).filter((item) => item.count), [filtered])
  const maxOutcome = Math.max(1, ...outcomeCounts.map((item) => item.count))
  const daily = useMemo(() => {
    const map = new Map()
    for (const call of filtered) {
      const day = new Date(call.started_at).toISOString().slice(0, 10)
      const item = map.get(day) || { day, calls: 0, booked: 0 }
      item.calls += 1; if (call.appointment_booked) item.booked += 1; map.set(day, item)
    }
    return [...map.values()].sort((a, b) => a.day.localeCompare(b.day)).slice(-14)
  }, [filtered])
  const maxDaily = Math.max(1, ...daily.map((item) => item.calls))
  const latestSync = calls.length ? new Date(Math.max(...calls.map((call) => new Date(call.synced_at).getTime()))) : null

  const sync = async () => {
    setSyncing(true); onMessage('')
    try {
      const response = await fetch('/api/vapi-sync', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ full: true }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not synchronize calls.')
      const removed = result.removedBeforeBaseline ? ` ${result.removedBeforeBaseline} older test records removed.` : ''
      onMessage(`${result.synchronized} Vapi call records synchronized.${removed}`); await onReload()
    } catch (error) { onMessage(error.message) }
    finally { setSyncing(false) }
  }

  return <div className="calling-dashboard">
    <header className="calling-toolbar"><div><h2>Calling performance</h2><p>Read-only Vapi reporting · client conversion excludes Dossy and your test number · live transfers do not include SMS notifications.</p></div><div className="calling-toolbar-actions"><span>{latestSync ? `Last synced ${latestSync.toLocaleString()}` : 'No calls synced yet'}</span><button className="secondary-button" onClick={sync} disabled={syncing}><RefreshCcw size={14} className={syncing ? 'spinning' : ''} /> {syncing ? 'Syncing…' : 'Sync now'}</button></div></header>
    <div className="calling-filters"><label>Period<select value={range} onChange={(event) => setRange(event.target.value)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select></label><label>Audience<select value={audience} onChange={(event) => setAudience(event.target.value)}><option value="clients">Clients only</option><option value="tests">Test calls</option><option value="all">All calls</option></select></label><label>Outcome<select value={outcome} onChange={(event) => setOutcome(event.target.value)}><option value="all">All outcomes</option>{Object.entries(OUTCOMES).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label></div>
    <section className="call-metrics"><Metric icon={PhoneCall} label="Calls" value={metrics.calls} /><Metric icon={Users} label="Unique callers" value={metrics.unique} /><Metric icon={CalendarCheck} label="Appointments" value={metrics.booked} detail={`${metrics.rate.toFixed(1)}% booking rate`} /><Metric icon={Route} label="Live transfers to Dossy" value={metrics.transferred} detail="Excludes SMS alerts" /><Metric icon={DollarSign} label="Vapi cost" value={`$${metrics.cost.toFixed(2)}`} /></section>
    <section className="call-charts"><article><h3>Automated outcome signals</h3><p className="chart-caveat">Intent labels come from Vapi analysis and require human review. Bookings use appointment evidence.</p><div className="outcome-chart">{outcomeCounts.map((item) => <div key={item.key}><span>{OUTCOMES[item.key]}</span><div><i style={{ width: `${(item.count / maxOutcome) * 100}%`, background: COLORS[item.key] }} /></div><strong>{item.count}</strong></div>)}{!outcomeCounts.length && <p>No calls match these filters.</p>}</div></article><article><h3>Calls and bookings by day</h3><div className="daily-chart">{daily.map((item) => <div key={item.day} title={`${item.day}: ${item.calls} calls, ${item.booked} booked`}><div><i style={{ height: `${Math.max(4, (item.calls / maxDaily) * 100)}%` }} /><b style={{ height: `${(item.booked / maxDaily) * 100}%` }} /></div><span>{new Date(`${item.day}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div>)}</div><div className="chart-legend"><span><i /> Calls</span><span><i /> Booked</span></div></article></section>
    <div className="admin-table-wrap call-table"><table className="admin-table"><thead><tr><th>Caller</th><th>Date</th><th>Duration</th><th>Outcome</th><th>Booked</th><th>Live transferred</th><th>Cost</th><th /></tr></thead><tbody>{filtered.map((call) => <tr key={call.id}><td><strong>{call.customer_name || shortPhone(call.caller_number)}</strong><small>{call.customer_name ? shortPhone(call.caller_number) : call.is_test ? 'Test caller' : 'Client'}</small></td><td>{new Date(call.started_at).toLocaleString()}</td><td>{formatDuration(call.duration_seconds)}</td><td><span className="call-outcome"><i style={{ background: COLORS[call.reviewed_category] }} />{OUTCOMES[call.reviewed_category] || 'Other / unclear'}</span></td><td>{call.appointment_booked ? 'Yes' : '—'}</td><td>{call.transferred_to_dossy ? 'Yes' : '—'}</td><td>${Number(call.cost || 0).toFixed(2)}</td><td><button className="table-button" onClick={() => setSelected(call)}>Details</button></td></tr>)}</tbody></table>{!filtered.length && <p className="call-empty">No calls match these filters.</p>}</div>
    {selected && <CallDetails call={selected} onClose={() => setSelected(null)} />}
  </div>
}

function Metric({ icon: Icon, label, value, detail }) { return <article><Icon /><div><strong>{value}</strong><span>{label}</span>{detail && <small>{detail}</small>}</div></article> }

function CallDetails({ call, onClose }) {
  return <div className="call-detail-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section className="call-detail"><header><div><p className="eyebrow">Vapi call record</p><h2>{call.customer_name || shortPhone(call.caller_number)}</h2></div><button onClick={onClose} aria-label="Close"><X /></button></header><div className="call-detail-grid"><span><small>Caller</small><strong>{shortPhone(call.caller_number)}</strong></span><span><small>Started</small><strong>{new Date(call.started_at).toLocaleString()}</strong></span><span><small>Duration</small><strong>{formatDuration(call.duration_seconds)}</strong></span><span><small>Outcome</small><strong>{OUTCOMES[call.reviewed_category]}</strong></span></div>{call.recording_url && <div className="call-recording"><h3>Recording</h3><audio controls preload="none" src={call.recording_url} /></div>}<div><h3>Summary</h3><p>{call.summary || 'No summary was generated.'}</p></div><details><summary>Transcript</summary><pre>{call.transcript || 'No transcript available.'}</pre></details></section></div>
}
