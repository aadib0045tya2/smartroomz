import { Heart, MapPin, Share2, Star } from 'lucide-react'
import { useState } from 'react'
import Modal from './Modal.jsx'
import PropertyImageGallery from './PropertyImageGallery.jsx'
import Amenities from './Amenities.jsx'
import PricingSelector from './PricingSelector.jsx'
import MoveInDateSelector from './MoveInDateSelector.jsx'
import PriceSummary from './PriceSummary.jsx'
import { getRent, money, planUnit } from '../utils/pricing.js'

export default function PropertyDetailModal({ property, initialPlan, initialDate, isFavorite, onFavorite, onApply, onRequestCall, onClose }) {
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [plan, setPlan] = useState(initialPlan || 'weekly')
  const [moveInDate, setMoveInDate] = useState(initialDate || property.earliestMoveInDate)
  const [shareMessage, setShareMessage] = useState('')
  const share = async () => {
    const data = { title: property.title, text: `Check out ${property.title} on Smart Roomz USA`, url: window.location.href }
    try { if (navigator.share) await navigator.share(data); else { await navigator.clipboard.writeText(window.location.href); setShareMessage('Link copied') } } catch { setShareMessage('Share canceled') }
  }
  return (
    <Modal onClose={onClose} className="detail-modal" label={`${property.title} details`}>
      <div className="detail-actions"><button onClick={share}><Share2 size={15} /> Share</button><button className={isFavorite ? 'saved' : ''} onClick={onFavorite}><Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} /> {isFavorite ? 'Saved' : 'Save'}</button>{shareMessage && <span>{shareMessage}</span>}</div>
      <PropertyImageGallery property={property} index={galleryIndex} setIndex={setGalleryIndex} />
      <div className="detail-layout">
        <div className="detail-copy">
          <p className="eyebrow">{property.availability}</p><h2>{property.title}</h2>
          <div className="detail-meta"><span><MapPin size={15} />{property.area}, {property.city}, {property.state} {property.zip}</span><span><Star size={14} fill="currentColor" />{property.rating}</span><span>{property.roomType}</span></div>
          <hr /><h3>About this room</h3><p>{property.description}</p><h3>What this place offers</h3><Amenities amenities={property.amenities} />
        </div>
        <aside className="booking-card">
          <div className="booking-price"><strong>{money(getRent(property, plan))}</strong><span> / {planUnit(plan)}</span></div>
          <p className="availability"><i /> {property.availability} · Earliest {new Date(`${property.earliestMoveInDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
          <label className="field"><span>Payment frequency</span><PricingSelector value={plan} onChange={setPlan} /></label>
          <MoveInDateSelector value={moveInDate} onChange={setMoveInDate} min={property.earliestMoveInDate} />
          <PriceSummary property={property} plan={plan} />
          <button className="primary-button wide" onClick={() => onApply({ property, plan, moveInDate })}>Apply for this room</button>
          <button className="secondary-button wide" onClick={() => onRequestCall({ property, moveInDate })}>Request a call</button>
          <p className="fine-print">You will review everything before submitting.</p>
        </aside>
      </div>
    </Modal>
  )
}
