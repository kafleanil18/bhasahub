import { useEffect, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { useInitialLoad } from '../navigation/pageLoad';
import { PLANS, formatRs } from '../pricing/plans';
import './PaymentSettings.css';

// Admin > Payment details (super admin): the bank account and merchant QR students pay to at
// checkout. Until a method is filled in, checkout shows clearly marked sample details for it.
const EMPTY = { bankName: '', accountName: '', accountNumber: '', branch: '', qrImage: '', qrLabel: '', note: '' };
const MAX_PRICE = 1000000;
// Prices are edited as text, one subscription and one live class price per plan.
const pricesFrom = plans => Object.fromEntries(PLANS.map(plan => {
  const row = plans?.find(item => item.id === plan.id) || plan;
  return [plan.id, { plan: String(row.price), liveClass: String(row.liveClassPrice) }];
}));
const validPrice = value => /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= MAX_PRICE;
const fromSaved = saved => ({
  bankName: saved?.bank?.bankName || '', accountName: saved?.bank?.accountName || '', accountNumber: saved?.bank?.accountNumber || '', branch: saved?.bank?.branch || '',
  qrImage: saved?.qr?.image || '', qrLabel: saved?.qr?.label || '', note: saved?.note || '',
});

async function readJson(response, fallback) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallback);
  return data;
}

export default function PaymentSettings() {
  const [form, setForm] = useState(EMPTY);
  const [saved, setSaved] = useState(EMPTY);
  const [prices, setPrices] = useState(() => pricesFrom(PLANS));
  const [savedPrices, setSavedPrices] = useState(() => pricesFrom(PLANS));
  const [inUse, setInUse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  useInitialLoad(loading, 'Loading payment details…');

  const apply = data => {
    const values = fromSaved(data.saved);
    setForm(values); setSaved(values);
    const nextPrices = pricesFrom(data.plans);
    setPrices(nextPrices); setSavedPrices(nextPrices);
    setInUse({ bank: !data.bank?.sample, qr: !data.qr?.sample });
  };
  useEffect(() => {
    let active = true;
    apiFetch('/api/payment-settings')
      .then(response => readJson(response, 'Could not load the payment details.'))
      .then(data => { if (active) apply(data); })
      .catch(err => { if (active) setLoadError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const set = (key, value) => { setStatus(''); setForm(previous => ({ ...previous, [key]: value })); };
  const pricesChanged = PLANS.some(plan => prices[plan.id].plan !== savedPrices[plan.id].plan || prices[plan.id].liveClass !== savedPrices[plan.id].liveClass);
  const dirty = Object.keys(EMPTY).some(key => form[key] !== saved[key]) || pricesChanged;
  const setPrice = (planId, kind, value) => { setStatus(''); setPrices(previous => ({ ...previous, [planId]: { ...previous[planId], [kind]: value.replace(/[^\d]/g, '') } })); };
  const pricesValid = PLANS.every(plan => validPrice(prices[plan.id].plan) && validPrice(prices[plan.id].liveClass));

  const uploadQr = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { setError('Upload the QR as a PNG, JPG or WebP image.'); return; }
    setUploading(true); setError(''); setStatus('');
    try {
      const body = new FormData();
      body.append('file', file);
      const data = await readJson(await apiFetch('/api/upload', { method: 'POST', body }), 'Could not upload the QR image.');
      set('qrImage', data.url);
    } catch (err) { setError(err.message); }
    finally { setUploading(false); }
  };

  const save = async event => {
    event.preventDefault();
    if (saving || uploading) return;
    if (!pricesValid) { setError(`Enter every price as whole rupees, from 1 to ${MAX_PRICE.toLocaleString('en-IN')}.`); return; }
    setSaving(true); setError(''); setStatus('');
    try {
      const data = await readJson(await apiFetch('/api/payment-settings', { method: 'PUT', json: {
        bank: { bankName: form.bankName, accountName: form.accountName, accountNumber: form.accountNumber, branch: form.branch },
        qr: { image: form.qrImage, label: form.qrLabel },
        note: form.note,
        prices: Object.fromEntries(PLANS.map(plan => [plan.id, { plan: Number(prices[plan.id].plan), liveClass: Number(prices[plan.id].liveClass) }])),
      } }), 'Could not save the payment details.');
      apply(data);
      setStatus('Payment details and prices saved. The pricing page and checkout use them now.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const field = (key, label, extra = {}) => <label className="pay-settings-field">{label}{extra.optional && <span> (optional)</span>}
    <input type="text" value={form[key]} maxLength={extra.max || 120} onChange={event => set(key, event.target.value)} placeholder={extra.placeholder} />
  </label>;
  const badge = ready => <span className={`pay-settings-badge${ready ? ' is-ready' : ''}`}>{ready ? 'Students see your details' : 'Students see sample details'}</span>;

  if (loadError) return <section className="pay-settings"><h1>Payment details</h1><p role="alert">{loadError}</p></section>;
  return <section className="pay-settings" aria-labelledby="pay-settings-title">
    <header>
      <p className="pay-settings-eyebrow">Plans</p>
      <h1 id="pay-settings-title">Payment details</h1>
      <p>Students pay for a plan by bank transfer or merchant QR, using the details below, then upload a screenshot of the payment. Until a method is filled in, checkout shows sample details for it and warns students not to pay into them.</p>
    </header>
    {!loading && <form onSubmit={save}>
      <fieldset className="pay-settings-group">
        <legend>Prices</legend>
        <p className="pay-settings-help">In whole rupees. The subscription unlocks every course, the practice studio and every mock test; live classes are an optional add-on at checkout. Payments already sent keep the price they were sent at.</p>
        <table className="pay-settings-prices">
          <thead><tr><th scope="col">Plan</th><th scope="col">Xiao Ao subscription</th><th scope="col">Live classes</th></tr></thead>
          <tbody>{PLANS.map(plan => <tr key={plan.id}>
            <th scope="row">{plan.label}</th>
            {['plan', 'liveClass'].map(kind => <td key={kind}>
              <label className="pay-settings-price"><span className="pay-settings-currency" aria-hidden="true">Rs</span>
                <input type="text" inputMode="numeric" aria-label={`${plan.label} ${kind === 'plan' ? 'subscription' : 'live classes'} price in rupees`} aria-invalid={!validPrice(prices[plan.id][kind]) || undefined} value={prices[plan.id][kind]} onChange={event => setPrice(plan.id, kind, event.target.value)} />
              </label>
              {kind === 'plan' && validPrice(prices[plan.id].plan) && plan.months > 1 && <small>{formatRs(Number(prices[plan.id].plan) / plan.months)} a month</small>}
            </td>)}
          </tr>)}</tbody>
        </table>
      </fieldset>
      <fieldset className="pay-settings-group">
        <legend>Bank account {inUse && badge(inUse.bank)}</legend>
        <p className="pay-settings-help">Fill in the bank, account name and account number to use your account. The branch is optional.</p>
        <div className="pay-settings-grid">
          {field('bankName', 'Bank', { placeholder: 'For example, Nabil Bank' })}
          {field('accountName', 'Account name', { placeholder: 'The name on the account' })}
          {field('accountNumber', 'Account number', { max: 60 })}
          {field('branch', 'Branch', { optional: true })}
        </div>
      </fieldset>
      <fieldset className="pay-settings-group">
        <legend>Merchant QR {inUse && badge(inUse.qr)}</legend>
        <p className="pay-settings-help">Upload the QR image from your merchant account (PNG, JPG or WebP).</p>
        <div className="pay-settings-qr">
          {form.qrImage ? <img src={form.qrImage} alt="Your merchant QR" width="160" height="160" /> : <span className="pay-settings-qr-empty">No QR uploaded</span>}
          <div>
            <label className="pay-settings-upload">{uploading ? 'Uploading…' : form.qrImage ? 'Replace QR image' : 'Upload QR image'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadQr} disabled={uploading || saving} />
            </label>
            {form.qrImage && <button type="button" className="pay-settings-remove" onClick={() => set('qrImage', '')} disabled={uploading || saving}>Remove QR</button>}
            {field('qrLabel', 'Label shown under the QR', { optional: true, max: 80, placeholder: 'For example, Fonepay merchant QR' })}
          </div>
        </div>
      </fieldset>
      <fieldset className="pay-settings-group">
        <legend>Note for students</legend>
        <label className="pay-settings-field">Shown under the payment details<span> (optional)</span>
          <textarea rows={2} value={form.note} maxLength={500} onChange={event => set('note', event.target.value)} placeholder="For example, write your email as the payment remark." />
        </label>
      </fieldset>
      {error && <p className="pay-settings-message is-error" role="alert">{error}</p>}
      {status && <p className="pay-settings-message is-success" role="status">{status}</p>}
      <div className="pay-settings-actions">
        <button type="submit" disabled={!dirty || saving || uploading}>{saving ? 'Saving…' : 'Save payment details'}</button>
        <button type="button" className="is-secondary" disabled={!dirty || saving} onClick={() => { setForm(saved); setPrices(savedPrices); setError(''); }}>Discard changes</button>
      </div>
    </form>}
  </section>;
}
