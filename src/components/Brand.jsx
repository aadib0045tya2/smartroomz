export default function Brand({ onClick }) {
  return (
    <button className="brand" onClick={onClick} aria-label="Smart Roomz USA home">
      <span className="brand-mark"><img src="/smart-roomz-mascot.webp" alt="" /></span>
      <span>Smart Roomz <small>USA</small></span>
    </button>
  )
}
