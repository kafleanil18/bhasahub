// Whole-platform subscription plans. Prices are Nepali rupees. The server is the
// source of truth: a plan request stores the price and days chosen here.
// `price` and `liveClassPrice` (live classes bought with the plan at checkout) are the defaults; a
// super admin can change both in Admin > Payment details (see currentPlans in utils/planPrices.js).
const PLANS = Object.freeze([
  Object.freeze({ id: '1-month', label: '1 month', months: 1, days: 30, price: 1000, liveClassPrice: 7000 }),
  Object.freeze({ id: '3-months', label: '3 months', months: 3, days: 90, price: 2000, liveClassPrice: 9000 }),
  Object.freeze({ id: '6-months', label: '6 months', months: 6, days: 180, price: 3000, liveClassPrice: 12000 }),
]);
const PLAN_IDS = PLANS.map(plan => plan.id);

function findPlan(id) {
  return PLANS.find(plan => plan.id === id) || null;
}

module.exports = { PLANS, PLAN_IDS, findPlan };
