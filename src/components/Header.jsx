import { Heart, Menu, Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import Brand from './Brand.jsx'

export default function Header({ currentView, setView, savedCount, onSearchFocus, onRequestCall }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const go = (view) => { setView(view); setMenuOpen(false) }
  return (
    <>
      <div className="announcement">Flexible furnished rooms across Metro Atlanta <span>•</span> Move in faster, pay your way</div>
      <header className="site-header">
        <div className="header-inner">
          <Brand onClick={() => go('browse')} />
          <button className="compact-search" onClick={onSearchFocus}>
            <span>Atlanta, GA</span><i /><span className="muted">Any week</span><i /><span className="muted">Private room</span>
            <b><Search size={15} /></b>
          </button>
          <nav className="desktop-actions" aria-label="Account navigation">
            <button onClick={onRequestCall}>Request a call</button>
            <button className={currentView === 'saved' ? 'active' : ''} onClick={() => go('saved')}><Heart size={16} /> Saved <em>{savedCount}</em></button>
            <button className="account-button" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Menu size={17} /><span><UserRound size={15} /></span></button>
            {menuOpen && (
              <div className="account-menu">
                <button onClick={() => { window.location.href = '/account' }}>My account</button>
                <button onClick={() => go('applications')}>My applications</button>
                <button onClick={() => go('saved')}>Saved rooms</button>
                <button onClick={onRequestCall}>Talk to our team</button>
                <button onClick={() => { window.location.href = '/admin' }}>Team admin</button>
              </div>
            )}
          </nav>
          <button className="mobile-menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button>
        </div>
        {menuOpen && <div className="mobile-menu"><button onClick={() => go('browse')}>Browse rooms</button><button onClick={() => { window.location.href = '/account' }}>My account</button><button onClick={() => go('saved')}>Saved rooms ({savedCount})</button><button onClick={() => go('applications')}>My applications</button><button onClick={onRequestCall}>Request a call</button><button onClick={() => { window.location.href = '/admin' }}>Team admin</button></div>}
      </header>
    </>
  )
}
