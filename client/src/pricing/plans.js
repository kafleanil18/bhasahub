// Mirrors server/utils/plans.js. The server decides the real price when a plan is requested.
export const PLANS = [
  { id: '1-month', label: '1 month', months: 1, price: 1000, note: 'Try it out' },
  { id: '3-months', label: '3 months', months: 3, price: 2000, note: 'Steady progress' },
  { id: '6-months', label: '6 months', months: 6, price: 3000, note: 'Best value', featured: true },
];
export const formatRs = amount => `Rs ${Math.round(amount).toLocaleString('en-IN')}`;
export const monthlyPrice = plan => Math.round(plan.price / plan.months);
export const savingPercent = plan => Math.round((1 - plan.price / (PLANS[0].price * plan.months)) * 100);
export const planLabel = id => PLANS.find(plan => plan.id === id)?.label || id;
