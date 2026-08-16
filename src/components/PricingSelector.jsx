import { paymentPlans } from '../data/properties.js'

export default function PricingSelector({ value, onChange }) {
  return <div className="pricing-selector" role="group" aria-label="Payment frequency">{paymentPlans.map((plan) => <button key={plan.value} className={value === plan.value ? 'active' : ''} onClick={() => onChange(plan.value)}>{plan.label}</button>)}</div>
}
