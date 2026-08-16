import { BadgeDollarSign, Clock3, Home, MapPin, Sparkles } from 'lucide-react'

const categories = [
  ['all', 'All rooms', Home], ['featured', 'Featured', Sparkles], ['under200', 'Under $200', BadgeDollarSign],
  ['fast', 'Fast move-in', Clock3], ['Midtown', 'Midtown', MapPin], ['Decatur', 'Decatur', MapPin], ['Stone Mountain', 'Stone Mountain', MapPin], ['Ellenwood', 'Ellenwood', MapPin],
]

export default function CategoryNav({ selected, onSelect, rightControls }) {
  return (
    <div className="category-nav">
      <div className="category-scroll">{categories.map(([value, label, Icon]) => <button key={value} className={selected === value ? 'active' : ''} onClick={() => onSelect(value)}><Icon size={19} /><span>{label}</span></button>)}</div>
      {rightControls}
    </div>
  )
}
