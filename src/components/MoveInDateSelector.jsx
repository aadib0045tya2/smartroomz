export default function MoveInDateSelector({ value, onChange, min }) {
  return <label className="field"><span>Move-in date</span><input type="date" value={value} min={min} onChange={(e) => onChange(e.target.value)} /></label>
}
