import { money } from '../utils/pricing.js'

export default function MapPanel({ properties, onOpen }) {
  const lats = properties.map((item) => item.latitude)
  const longs = properties.map((item) => item.longitude)
  const position = (value, values) => values.length < 2 ? 50 : 12 + ((value - Math.min(...values)) / (Math.max(...values) - Math.min(...values) || 1)) * 76
  return (
    <aside className="map-panel" aria-label="Map of room locations">
      <div className="map-road road-one" /><div className="map-road road-two" /><span className="map-city">ATLANTA</span><span className="map-city decatur">DECATUR</span>
      {properties.map((property) => <button key={property.id} className="map-pin" style={{ left: `${position(property.longitude, longs)}%`, top: `${88 - position(property.latitude, lats)}%` }} onClick={() => onOpen(property)}>{money(property.weeklyPrice)}</button>)}
      <p>Approximate locations shown</p>
    </aside>
  )
}
