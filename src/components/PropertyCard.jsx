import { Star } from 'lucide-react'
import FavoriteButton from './FavoriteButton.jsx'
import { money, planUnit, getRent } from '../utils/pricing.js'

export default function PropertyCard({ property, plan, isFavorite, onFavorite, onOpen }) {
  return (
    <article className="property-card" onClick={onOpen}>
      <div className="property-image">
        <img src={property.images[0]} alt={`${property.title} furnished bedroom`} />
        <span className="property-badge">{property.featured ? 'Guest favorite' : property.availability}</span>
        <FavoriteButton active={isFavorite} onToggle={onFavorite} />
      </div>
      <button className="property-copy" onClick={onOpen}>
        <div className="property-title"><h3>{property.title}</h3><span><Star size={12} fill="currentColor" /> {property.rating}</span></div>
        <p>{property.area} · {property.city}, {property.state}</p>
        <p>{property.roomType} · Furnished</p>
        <div className="property-price"><strong>{money(getRent(property, plan))}</strong> / {planUnit(plan)}</div>
      </button>
    </article>
  )
}
