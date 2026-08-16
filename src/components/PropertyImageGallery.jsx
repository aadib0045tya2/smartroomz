import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function PropertyImageGallery({ property, index, setIndex }) {
  const previous = () => setIndex((index - 1 + property.images.length) % property.images.length)
  const next = () => setIndex((index + 1) % property.images.length)
  return (
    <div className="detail-gallery">
      <div className="gallery-main"><img src={property.images[index]} alt={`${property.title}, image ${index + 1}`} /><button className="gallery-prev" onClick={previous} aria-label="Previous image"><ChevronLeft /></button><button className="gallery-next" onClick={next} aria-label="Next image"><ChevronRight /></button><span>{index + 1} / {property.images.length}</span></div>
      <div className="gallery-side"><img src={property.images[(index + 1) % property.images.length]} alt="Additional room view" /><img src={property.images[(index + 2) % property.images.length]} alt="Additional home view" /></div>
    </div>
  )
}
