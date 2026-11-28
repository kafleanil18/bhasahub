const express = require('express');
const PaymentSettings = require('../models/PaymentSettings');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');
const { paymentDetails } = require('../utils/paymentDetails');
const { plansWithPrices, validPrice, MAX_PRICE } = require('../utils/planPrices');
const { PLAN_IDS } = require('../utils/plans');

const router = express.Router();
const LIMITS = { bankName: 120, accountName: 120, accountNumber: 60, branch: 120, qrLabel: 80, note: 500 };

// GET /api/payment-settings — signed in: the bank account and merchant QR shown at checkout.
// Super admins also get the saved values, so the settings form shows only what they entered.
router.get('/', requireAuth, async (req, res) => {
  try {
    const settings = await PaymentSettings.findOne({ key: 'main' }).lean();
    const details = paymentDetails(settings);
    if (req.user.role !== 'superadmin') return res.json(details);
    res.json({ ...details, saved: { bank: settings?.bank || {}, qr: settings?.qr || {}, note: settings?.note || '' }, plans: plansWithPrices(settings?.prices) });
  } catch {
    res.status(500).json({ error: 'Could not load the payment details' });
  }
});

// PUT /api/payment-settings — super admin: save the bank account, merchant QR and payment note.
// The QR image must be an uploaded image (an https link from the uploader).
router.put('/', requireAuth, requireSuperAdmin, async (req, res) => {
  const body = req.body || {};
  const bank = body.bank || {};
  const qr = body.qr || {};
  const fields = {
    bankName: bank.bankName, accountName: bank.accountName, accountNumber: bank.accountNumber, branch: bank.branch,
    qrLabel: qr.label, note: body.note,
  };
  for (const [name, value] of Object.entries(fields)) {
    if (value !== undefined && (typeof value !== 'string' || value.trim().length > LIMITS[name])) {
      return res.status(400).json({ error: `Check the ${name.replace(/([A-Z])/g, ' $1').toLowerCase()}: up to ${LIMITS[name]} characters.` });
    }
  }
  if (qr.image !== undefined && (typeof qr.image !== 'string' || (qr.image.trim() && !/^https:\/\/[^\s]{1,2000}$/.test(qr.image.trim())))) {
    return res.status(400).json({ error: 'Upload the QR as an image.' });
  }
  // Prices: for each plan, the subscription and live class prices in whole rupees.
  let prices;
  if (body.prices !== undefined) {
    if (!body.prices || typeof body.prices !== 'object' || Array.isArray(body.prices)) return res.status(400).json({ error: 'Prices must be set for each plan.' });
    prices = {};
    for (const id of PLAN_IDS) {
      const row = body.prices[id] || {};
      if (!validPrice(row.plan) || !validPrice(row.liveClass)) return res.status(400).json({ error: `Enter whole-rupee prices from 1 to ${MAX_PRICE.toLocaleString('en-IN')} for every plan and its live classes.` });
      prices[id] = { plan: row.plan, liveClass: row.liveClass };
    }
  }
  const text = value => (typeof value === 'string' ? value.trim() : '');
  const update = {
    bank: { bankName: text(bank.bankName), accountName: text(bank.accountName), accountNumber: text(bank.accountNumber), branch: text(bank.branch) },
    qr: { image: text(qr.image), label: text(qr.label) },
    note: text(body.note),
    ...(prices ? { prices } : {}),
  };
  try {
    const settings = await PaymentSettings.findOneAndUpdate({ key: 'main' }, { $set: update, $setOnInsert: { key: 'main' } }, { returnDocument: 'after', upsert: true }).lean();
    logActivity(req, { action: 'update', resourceType: 'payment-settings', resourceId: settings?._id, label: 'Payment details' });
    res.json({ ...paymentDetails(settings), saved: { bank: settings.bank, qr: settings.qr, note: settings.note }, plans: plansWithPrices(settings.prices) });
  } catch {
    res.status(500).json({ error: 'Could not save the payment details' });
  }
});

module.exports = router;
