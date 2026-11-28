// The payment details students see at checkout. Until a super admin enters real ones, each method
// shows sample details marked `sample: true`, and the checkout says they aren't a real account.
const SAMPLE_BANK = { bankName: 'Sample Bank Ltd.', accountName: 'Xiao Ao Learning (sample)', accountNumber: '0000 1111 2222 3333', branch: 'Kathmandu' };
const SAMPLE_QR = { image: '/payments/sample-qr.svg', label: 'Sample merchant QR' };

const clean = value => (typeof value === 'string' ? value.trim() : '');

function paymentDetails(settings) {
  const bank = settings?.bank || {};
  const qr = settings?.qr || {};
  const bankReady = !!(clean(bank.bankName) && clean(bank.accountName) && clean(bank.accountNumber));
  const qrReady = !!clean(qr.image);
  return {
    bank: bankReady
      ? { bankName: clean(bank.bankName), accountName: clean(bank.accountName), accountNumber: clean(bank.accountNumber), branch: clean(bank.branch), sample: false }
      : { ...SAMPLE_BANK, sample: true },
    qr: qrReady ? { image: clean(qr.image), label: clean(qr.label) || 'Merchant QR', sample: false } : { ...SAMPLE_QR, sample: true },
    note: clean(settings?.note),
  };
}

module.exports = { paymentDetails, SAMPLE_BANK, SAMPLE_QR };
