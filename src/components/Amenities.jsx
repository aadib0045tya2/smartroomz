import { Check } from 'lucide-react'

export default function Amenities({ amenities }) {
  return <div className="amenities">{amenities.map((amenity) => <span key={amenity}><Check size={16} />{amenity}</span>)}</div>
}
