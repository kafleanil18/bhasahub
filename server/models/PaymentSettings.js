const mongoose = require('mongoose');

// Where students pay for a plan: a bank account and a merchant QR, set by a super admin in
// Admin > Payment details. Empty fields fall back to clearly marked sample details
// (see utils/paymentDetails.js) until the real ones are entered.
const paymentSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true },
  bank: {
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branch: { type: String, default: '' },
  },
  qr: {
    image: { type: String, default: '' },
    label: { type: String, default: '' },
  },
  note: { type: String, default: '' },
  // Prices a super admin set, by plan id: { plan, liveClass } in rupees. Missing ones use the defaults.
  prices: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false });

module.exports = mongoose.model('PaymentSettings', paymentSettingsSchema);
