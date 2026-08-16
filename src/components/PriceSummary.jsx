import { getPriceSummary, money, planLabel } from '../utils/pricing.js'

export default function PriceSummary({ property, plan }) {
  const summary = getPriceSummary(property, plan)
  return <div className="price-summary"><div><span>{planLabel(plan)} rent</span><b>{money(summary.rent)}</b></div><div><span>Refundable deposit</span><b>{money(summary.deposit)}</b></div><div><span>Application & background fee</span><b>{money(summary.fee)}</b></div><div className="summary-total"><span>Move-in total</span><b>{money(summary.total)}</b></div></div>
}
