import { Heart } from 'lucide-react'

export default function FavoriteButton({ active, onToggle, label = 'Save room' }) {
  return <button className={`favorite-button ${active ? 'saved' : ''}`} onClick={(event) => { event.stopPropagation(); onToggle() }} aria-label={active ? 'Remove from saved rooms' : label} aria-pressed={active}><Heart size={19} fill={active ? 'currentColor' : 'none'} /></button>
}
