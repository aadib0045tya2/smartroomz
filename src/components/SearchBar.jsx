import { CalendarDays, ChevronDown, MapPin, Search } from 'lucide-react'
import { paymentPlans } from '../data/properties.js'

export default function SearchBar({ draft, setDraft, onSearch, searchRef }) {
  const update = (key, value) => setDraft((current) => ({ ...current, [key]: value }))
  return (
    <section className="search-wrap" ref={searchRef} aria-label="Search rooms">
      <div className="search-bar">
        <label><span>Where</span><div><MapPin size={15} /><input value={draft.location} onChange={(e) => update('location', e.target.value)} placeholder="City or area" /></div></label>
        <label><span>Move in</span><div><CalendarDays size={15} /><input type="date" value={draft.moveInDate} onChange={(e) => update('moveInDate', e.target.value)} /></div></label>
        <label><span>Room type</span><div><select value={draft.roomType} onChange={(e) => update('roomType', e.target.value)}><option value="any">Any room</option><option value="Private room">Private room</option><option value="Private suite">Private suite</option></select><ChevronDown size={14} /></div></label>
        <label><span>Pay</span><div><select value={draft.paymentPlan} onChange={(e) => update('paymentPlan', e.target.value)}>{paymentPlans.map((plan) => <option key={plan.value} value={plan.value}>{plan.label}</option>)}</select><ChevronDown size={14} /></div></label>
        <button className="search-submit" onClick={onSearch}><Search size={18} /><span>Search</span></button>
      </div>
      <div className="search-trust"><span>✓ No long-term lease required</span><span>✓ Furnished and ready</span><span>✓ Local support team</span></div>
    </section>
  )
}
