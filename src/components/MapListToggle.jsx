import { List, Map } from 'lucide-react'

export default function MapListToggle({ showMap, setShowMap }) {
  return <button className="outline-button map-toggle" onClick={() => setShowMap(!showMap)}>{showMap ? <List size={16} /> : <Map size={16} />}{showMap ? 'Show list' : 'Show map'}</button>
}
