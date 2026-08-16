import { SearchX } from 'lucide-react'
import PropertyCard from './PropertyCard.jsx'

export default function PropertyGrid({ properties, plan, favorites, onFavorite, onOpen, onClear }) {
  if (!properties.length) return <div className="empty-state"><SearchX size={38} /><h2>No rooms match those filters</h2><p>Try broadening the area, price, or move-in selections.</p><button className="outline-button" onClick={onClear}>Clear all filters</button></div>
  return <div className="property-grid">{properties.map((property) => <PropertyCard key={property.id} property={property} plan={plan} isFavorite={favorites.includes(property.id)} onFavorite={() => onFavorite(property.id)} onOpen={() => onOpen(property)} />)}</div>
}
