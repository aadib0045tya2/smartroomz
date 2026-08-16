import { BadgeCheck, CalendarCheck2, Headphones, KeyRound, Search, ShieldCheck, WalletCards } from 'lucide-react'
import { useState } from 'react'

const faqs = [
  ['What is included in the listed price?', 'Each furnished room includes the home amenities shown on its listing. Utilities and Wi-Fi are included where listed. The move-in summary clearly separates rent, deposit, and the one-time application/background fee.'],
  ['Do I need a long-term lease?', 'No. Smart Roomz is built around flexible furnished stays with weekly, bi-weekly, and monthly payment choices. Specific house terms are reviewed before move-in.'],
  ['How quickly can I move in?', 'Many rooms support fast move-in after your application and screening are completed. Check each listing for its earliest move-in date.'],
  ['Are these private rooms?', 'Most listings are private furnished bedrooms in shared homes. Private suites are labeled separately, and all room types can be filtered in search.'],
]

export default function MarketingSections({ onBrowse, onRequestCall }) {
  const [openFaq, setOpenFaq] = useState(0)
  return <>
    <section className="how-section" id="how-it-works"><div className="how-copy"><p className="eyebrow">Simple from search to move-in</p><h2>A better path to your next room.</h2><p>Skip the traditional apartment maze. Choose a furnished room, select a payment schedule, and apply in minutes.</p></div><div className="steps"><Step icon={Search} number="01" title="Find your room" text="Search by area, move-in date, room style, and a payment plan that fits." /><Step icon={CalendarCheck2} number="02" title="Apply with clarity" text="Review the exact rent, deposit, fees, and move-in total before submitting." /><Step icon={KeyRound} number="03" title="Move in faster" text="Our local team helps qualified renters complete the next steps." /></div></section>
    <section className="trust-section"><Trust icon={BadgeCheck} title="Verified listings" text="Clear room details and real furnished-home photography." /><Trust icon={WalletCards} title="Flexible payments" text="Choose weekly, bi-weekly, or monthly pricing." /><Trust icon={ShieldCheck} title="Safety-minded" text="A consistent application and screening process." /><Trust icon={Headphones} title="Local support" text="Talk to a real Smart Roomz housing specialist." /></section>
    <section className="faq-section" id="faq"><p className="eyebrow">Good to know</p><h2>Frequently asked questions</h2><div className="faq-list">{faqs.map(([question, answer], index) => <article key={question}><button onClick={() => setOpenFaq(openFaq === index ? -1 : index)} aria-expanded={openFaq === index}><span>{question}</span><b>{openFaq === index ? '−' : '+'}</b></button>{openFaq === index && <p>{answer}</p>}</article>)}</div></section>
    <section className="help-banner"><div><p className="eyebrow">Need a little help?</p><h2>Tell us what you need. We’ll help you find the right furnished room.</h2></div><div><button className="primary-button" onClick={onBrowse}>Browse rooms</button><button className="secondary-button" onClick={onRequestCall}>Request a call</button></div></section>
  </>
}

function Step({ icon: Icon, number, title, text }) { return <article><div><Icon size={18} /><span>{number}</span></div><h3>{title}</h3><p>{text}</p></article> }
function Trust({ icon: Icon, title, text }) { return <article><span><Icon size={20} /></span><div><h3>{title}</h3><p>{text}</p></div></article> }
