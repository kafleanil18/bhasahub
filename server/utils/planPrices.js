const PaymentSettings = require('../models/PaymentSettings');
const { PLANS } = require('./plans');

// The plans with today's prices: the defaults in utils/plans.js, with any prices a super admin set
// in Admin > Payment details on top. `price` is the subscription; `liveClassPrice` is live classes
// for the same length, which a student can add at checkout.
const MAX_PRICE = 1000000;
const validPrice = value => Number.isInteger(value) && value > 0 && value <= MAX_PRICE;

function plansWithPrices(saved) {
  return PLANS.map(plan => {
    const custom = saved?.[plan.id] || {};
    return { ...plan, price: validPrice(custom.plan) ? custom.plan : plan.price, liveClassPrice: validPrice(custom.liveClass) ? custom.liveClass : plan.liveClassPrice };
  });
}

async function currentPlans() {
  const settings = await PaymentSettings.findOne({ key: 'main' }).select('prices').lean();
  return plansWithPrices(settings?.prices);
}

async function findCurrentPlan(id) {
  return (await currentPlans()).find(plan => plan.id === id) || null;
}

module.exports = { currentPlans, findCurrentPlan, plansWithPrices, validPrice, MAX_PRICE };
