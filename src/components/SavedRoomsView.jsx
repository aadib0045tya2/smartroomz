import { Heart } from 'lucide-react'
import PropertyGrid from './PropertyGrid.jsx'

export default function SavedRoomsView({ properties, plan, favorites, onFavorite, onOpen, onBrowse }) {
  return <main className="page-shell saved-page"><div className="page-title"><p className="eyebrow">Your shortlist</p><h1>Saved rooms</h1><p>Keep track of furnished rooms that feel like the right fit.</p></div>{properties.length ? <PropertyGrid properties={properties} plan={plan} favorites={favorites} onFavorite={onFavorite} onOpen={onOpen} /> : <div className="empty-state"><Heart size={42} /><h2>No saved rooms yet</h2><p>Tap the heart on any listing and it will appear here—even after a refresh.</p><button className="primary-button" onClick={onBrowse}>Explore rooms</button></div>}</main>
}
