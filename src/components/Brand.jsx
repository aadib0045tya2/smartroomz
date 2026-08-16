import { House } from 'lucide-react'

export default function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Smart Roomz USA home">
      <span className="brand-mark"><House size={19} strokeWidth={2.5} /></span>
      <span>Smart Roomz <small>USA</small></span>
    </button>
  )
}
