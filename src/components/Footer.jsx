import Brand from './Brand.jsx'

export default function Footer({ setView, onRequestCall }) {
  const go = (view) => { setView(view); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <footer><div className="footer-grid"><div><Brand onClick={() => go('browse')} /><p>Flexible furnished rooms for people who need a simpler, faster path to housing in Metro Atlanta.</p></div><div><h3>Explore</h3><button onClick={() => go('browse')}>Browse rooms</button><button onClick={() => go('saved')}>Saved rooms</button><button onClick={() => go('applications')}>My applications</button></div><div><h3>Learn</h3><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a><button onClick={onRequestCall}>Request a call</button></div><div><h3>Smart Roomz</h3><span>Metro Atlanta, Georgia</span><span>Housing support, made human.</span></div></div><div className="footer-bottom"><span>© 2026 Smart Roomz USA</span><span>Secure $175 room-hold deposits powered by Square</span></div></footer>
}
