import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';

// Mirrors server/utils/plans.js. These are the default prices; the real ones come from
// GET /api/plans (a super admin can change them in Admin > Payment details), and the server
// decides the price when a payment is sent. liveClassPrice is live classes for the same length,
// which can be added at checkout.
export const PLANS = [
  { id: '1-month', label: '1 month', months: 1, days: 30, price: 1000, liveClassPrice: 7000, note: 'Try it out' },
  { id: '3-months', label: '3 months', months: 3, days: 90, price: 2000, liveClassPrice: 9000, note: 'Steady progress' },
  { id: '6-months', label: '6 months', months: 6, days: 180, price: 3000, liveClassPrice: 12000, note: 'Best value', featured: true },
];
export const formatRs = amount => `Rs ${Math.round(amount).toLocaleString('en-IN')}`;
export const monthlyPrice = plan => Math.round(plan.price / plan.months);
export const savingPercent = (plan, plans = PLANS) => Math.max(0, Math.round((1 - plan.price / (plans[0].price * plan.months)) * 100));
export const planLabel = id => PLANS.find(plan => plan.id === id)?.label || id;

// Today's plans and prices. Shows the defaults straight away and swaps in the server's prices.
export function usePlans() {
  const [plans, setPlans] = useState(PLANS);
  useEffect(() => {
    let active = true;
    apiFetch('/api/plans', { auth: false })
      .then(response => (response.ok ? response.json() : null))
      .then(rows => {
        if (!active || !Array.isArray(rows)) return;
        setPlans(PLANS.map(plan => {
          const row = rows.find(item => item.id === plan.id);
          return row && Number.isFinite(row.price) ? { ...plan, price: row.price, liveClassPrice: Number.isFinite(row.liveClassPrice) ? row.liveClassPrice : plan.liveClassPrice } : plan;
        }));
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);
  return plans;
}
