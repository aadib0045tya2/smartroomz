import { ClipboardList, Heart, Home, Phone } from 'lucide-react'

export default function MobileNavigation({ view, setView, onRequestCall }) {
  return <nav className="mobile-navigation" aria-label="Mobile navigation"><button className={view === 'browse' ? 'active' : ''} onClick={() => setView('browse')}><Home /><span>Explore</span></button><button className={view === 'saved' ? 'active' : ''} onClick={() => setView('saved')}><Heart /><span>Saved</span></button><button className={view === 'applications' ? 'active' : ''} onClick={() => setView('applications')}><ClipboardList /><span>Applications</span></button><button onClick={onRequestCall}><Phone /><span>Call</span></button></nav>
}
