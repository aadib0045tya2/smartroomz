export const money = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(amount)

export function getRent(property, plan) {
  return property[`${plan}Price`] ?? property.weeklyPrice
}

export function getPriceSummary(property, plan) {
  const rent = getRent(property, plan)
  return { rent, deposit: property.deposit, fee: property.applicationFee, total: rent + property.deposit + property.applicationFee }
}

export const planLabel = (plan) => ({ weekly: 'Weekly', biweekly: 'Bi-weekly', monthly: 'Monthly' }[plan] || 'Weekly')
export const planUnit = (plan) => ({ weekly: 'week', biweekly: '2 weeks', monthly: 'month' }[plan] || 'week')
