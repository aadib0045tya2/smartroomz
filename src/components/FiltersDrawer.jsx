import { SlidersHorizontal, X } from 'lucide-react'

export function FilterButton({ count, onClick }) {
  return <button className="outline-button" onClick={onClick}><SlidersHorizontal size={16} /> Filters {count > 0 && <b className="filter-count">{count}</b>}</button>
}

export default function FiltersDrawer({ open, filters, setFilters, onClose, onClear, resultCount }) {
  if (!open) return null
  const update = (key, value) => setFilters((current) => ({ ...current, [key]: value }))
  const toggleArea = (area) => update('areas', filters.areas.includes(area) ? filters.areas.filter((item) => item !== area) : [...filters.areas, area])
  return (
    <div className="drawer-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside className="filter-drawer" role="dialog" aria-modal="true" aria-label="Room filters">
        <div className="drawer-header"><h2>Filters</h2><button onClick={onClose} aria-label="Close filters"><X /></button></div>
        <div className="drawer-body">
          <fieldset><legend>Area</legend><div className="chip-group">{['Midtown', 'Decatur', 'Stone Mountain', 'Atlanta', 'Ellenwood'].map((area) => <button type="button" key={area} className={filters.areas.includes(area) ? 'selected' : ''} onClick={() => toggleArea(area)}>{area}</button>)}</div></fieldset>
          <fieldset><legend>Price range</legend><div className="price-inputs"><label>Minimum<input type="number" min="0" placeholder="$0" value={filters.minPrice} onChange={(e) => update('minPrice', e.target.value)} /></label><label>Maximum<input type="number" min="0" placeholder="$1,000" value={filters.maxPrice} onChange={(e) => update('maxPrice', e.target.value)} /></label></div><label className="check-row"><input type="checkbox" checked={filters.under200} onChange={(e) => update('under200', e.target.checked)} /> Under $200 per selected payment period</label></fieldset>
          <fieldset><legend>Availability</legend><label className="check-row"><input type="checkbox" checked={filters.fast} onChange={(e) => update('fast', e.target.checked)} /> Available now or fast move-in</label></fieldset>
          <fieldset><legend>Room type</legend><select value={filters.roomType} onChange={(e) => update('roomType', e.target.value)}><option value="any">Any room type</option><option value="Private room">Private room</option><option value="Private suite">Private suite</option></select></fieldset>
          <fieldset><legend>Payment frequency</legend><select value={filters.paymentPlan} onChange={(e) => update('paymentPlan', e.target.value)}><option value="any">Any frequency</option><option value="weekly">Weekly</option><option value="biweekly">Bi-weekly</option><option value="monthly">Monthly</option></select></fieldset>
        </div>
        <div className="drawer-footer"><button className="text-button" onClick={onClear}>Clear all</button><button className="primary-button" onClick={onClose}>Show {resultCount} rooms</button></div>
      </aside>
    </div>
  )
}
