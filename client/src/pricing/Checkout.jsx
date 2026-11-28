import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../lib/apiClient';
import { formatRs } from './plans';
import './Checkout.css';

// Paying for a plan, in steps: choose bank transfer or merchant QR, confirm the plan, see the bank
// account or QR and pay with your own app, then upload a screenshot of the payment (required) with
// any transaction details. An admin checks the payment and starts the plan.
const METHODS = {
  bank: { title: 'Bank transfer', text: 'Send the amount from your bank or mobile banking app to our account.' },
  qr: { title: 'Merchant QR / eSewa', text: 'Scan our QR code with eSewa, or your banking or wallet app, and pay.' },
};
const STEPS = ['method', 'confirm', 'pay', 'proof'];
const STEP_TITLES = { method: 'Choose how to pay', confirm: 'Confirm your plan', pay: 'Pay', proof: 'Upload your payment screenshot' };
const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROOF_MAX_BYTES = 8 * 1024 * 1024;

async function readJson(response, fallback) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || fallback);
  return data;
}

function BankIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 10 9-6 9 6"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/></svg>;
}
function QrIcon() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4h-1"/></svg>;
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* Clipboard blocked: the value is still on screen. */ }
  };
  return <div className="checkout-detail">
    <dt>{label}</dt>
    <dd><span>{value}</span><button type="button" className="checkout-copy" onClick={copy} aria-label={`Copy ${label.toLowerCase()}`}>{copied ? 'Copied' : 'Copy'}</button></dd>
  </div>;
}

export default function Checkout({ plan, onClose, onSubmitted, onChangePlan }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const [step, setStep] = useState('method');
  const [method, setMethod] = useState('');
  // Live classes for the same length can be added to the plan on the confirm step.
  const [liveClass, setLiveClass] = useState(false);
  const total = plan.price + (liveClass ? plan.liveClassPrice : 0);
  const totalLabel = liveClass ? `${plan.label} plan + live classes` : `${plan.label} plan`;
  const [details, setDetails] = useState(null);
  const [detailsError, setDetailsError] = useState('');
  const [proof, setProof] = useState({ url: '', name: '', preview: '', uploading: false, error: '' });
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    let active = true;
    apiFetch('/api/payment-settings')
      .then(response => readJson(response, 'Could not load the payment details.'))
      .then(data => { if (active) setDetails(data); })
      .catch(err => { if (active) setDetailsError(err.message); });
    return () => { active = false; };
  }, []);
  // Each new step is announced by moving focus to its heading.
  useEffect(() => { heading.current?.focus(); }, [step]);
  useEffect(() => () => { if (proof.preview) URL.revokeObjectURL(proof.preview); }, [proof.preview]);

  const close = () => { if (!sending && !proof.uploading) onClose(); };
  const stepNumber = STEPS.indexOf(step) + 1;
  const chosen = details && method ? details[method] : null;

  const chooseFile = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PROOF_TYPES.includes(file.type)) { setProof(previous => ({ ...previous, error: 'Choose a JPG, PNG or WebP image of your payment.' })); return; }
    if (file.size > PROOF_MAX_BYTES) { setProof(previous => ({ ...previous, error: 'The screenshot must be 8 MB or smaller.' })); return; }
    const preview = URL.createObjectURL(file);
    setProof({ url: '', name: file.name, preview, uploading: true, error: '' });
    try {
      const form = new FormData();
      form.append('file', file);
      const data = await readJson(await apiFetch('/api/plans/payment-proof', { method: 'POST', body: form }), 'Could not upload the screenshot. Please try again.');
      setProof(previous => ({ ...previous, url: data.url, uploading: false }));
    } catch (err) {
      setProof(previous => ({ ...previous, url: '', uploading: false, error: err.message }));
    }
  };

  const submit = async event => {
    event.preventDefault();
    if (!proof.url || sending) return;
    setSending(true); setError('');
    try {
      const request = await readJson(await apiFetch('/api/plans/requests', { method: 'POST', json: { planId: plan.id, liveClass, method, screenshot: proof.url, reference, note } }), 'Could not send your payment. Please try again.');
      setStep('done');
      onSubmitted(request);
    } catch (err) { setError(err.message); }
    finally { setSending(false); }
  };

  return <dialog ref={dialog} className="checkout" aria-labelledby="checkout-title" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="checkout-head">
      <div>
        <p className="checkout-eyebrow">{step === 'done' ? 'Payment sent' : `Step ${stepNumber} of ${STEPS.length}`}</p>
        <h2 id="checkout-title" ref={heading} tabIndex={-1}>{step === 'done' ? 'Thank you, we’ve got your payment' : STEP_TITLES[step]}</h2>
      </div>
      <button type="button" className="checkout-close" onClick={close} aria-label="Close" disabled={sending || proof.uploading}>×</button>
    </div>
    {step !== 'done' && <ol className="checkout-progress" aria-hidden="true">{STEPS.map((name, index) => <li key={name} className={index < stepNumber ? 'is-done' : ''} />)}</ol>}
    {step !== 'method' && step !== 'done' && <p className="checkout-total" aria-live="polite"><span>Total, {totalLabel}</span><strong>{formatRs(total)}</strong></p>}

    {step === 'method' && <div className="checkout-body">
      <p className="checkout-intro">{plan.label} plan, {formatRs(plan.price)}. You can add live classes on the next step. How would you like to pay?</p>
      <div className="checkout-methods" role="radiogroup" aria-label="Payment method">
        {Object.entries(METHODS).map(([id, item]) => <button key={id} type="button" role="radio" aria-checked={method === id} className={`checkout-method${method === id ? ' is-selected' : ''}`} onClick={() => setMethod(id)}>
          <span className="checkout-method-icon">{id === 'bank' ? <BankIcon /> : <QrIcon />}</span>
          {id === 'qr' && <span className="checkout-esewa" aria-hidden="true">eSewa</span>}
          <span><strong>{item.title}</strong><small>{item.text}</small></span>
        </button>)}
      </div>
      <div className="checkout-actions">
        <button type="button" className="checkout-secondary" onClick={close}>Cancel</button>
        <button type="button" className="checkout-primary" disabled={!method} onClick={() => setStep('confirm')}>Continue</button>
      </div>
    </div>}

    {step === 'confirm' && <div className="checkout-body">
      <dl className="checkout-summary">
        <div><dt>Plan</dt><dd className="checkout-line"><span>{plan.label}: every HSK course, the practice studio and every mock test</span><span>{formatRs(plan.price)}</span></dd></div>
        {liveClass && <div><dt>Live classes</dt><dd className="checkout-line"><span>Live classes with a teacher for {plan.label}</span><span>{formatRs(plan.liveClassPrice)}</span></dd></div>}
        <div><dt>Paying by</dt><dd>{METHODS[method].title}</dd></div>
        <div className="checkout-summary-total"><dt>Total</dt><dd className="checkout-amount">{formatRs(total)}</dd></div>
      </dl>
      <label className={`checkout-addon${liveClass ? ' is-checked' : ''}`}>
        <input type="checkbox" checked={liveClass} onChange={event => setLiveClass(event.target.checked)} />
        <span>
          <strong>Also pay for live classes: {formatRs(plan.liveClassPrice)} for {plan.label}</strong>
          <small>Learn with a teacher in live classes for the same {plan.months === 1 ? 'month' : `${plan.months} months`}, alongside your plan. We’ll be in touch to arrange your classes.</small>
        </span>
      </label>
      <p className="checkout-hint">Billed once. It doesn’t renew automatically. <button type="button" className="checkout-link" onClick={onChangePlan}>Choose a different plan</button></p>
      <div className="checkout-actions">
        <button type="button" className="checkout-secondary" onClick={() => setStep('method')}>Back</button>
        <button type="button" className="checkout-primary" onClick={() => setStep('pay')}>Confirm and see payment details</button>
      </div>
    </div>}

    {step === 'pay' && <div className="checkout-body">
      <p className="checkout-intro">Pay <strong>{formatRs(total)}</strong>{liveClass ? ` (plan ${formatRs(plan.price)} + live classes ${formatRs(plan.liveClassPrice)})` : ''} {method === 'bank' ? 'to this account' : 'with this QR code'} using your own app. Then take a screenshot of the payment confirmation: you’ll upload it next.</p>
      {detailsError ? <p className="checkout-error" role="alert">{detailsError}</p>
        : !chosen ? <p className="checkout-status" role="status">Loading the payment details…</p>
          : <>
            {chosen.sample && <p className="checkout-sample" role="note"><strong>Sample details.</strong> These aren’t a real account yet, so don’t pay into them. A super admin adds the real details in Admin, Payment details.</p>}
            {method === 'bank'
              ? <dl className="checkout-details">
                <CopyRow label="Bank" value={chosen.bankName} />
                <CopyRow label="Account name" value={chosen.accountName} />
                <CopyRow label="Account number" value={chosen.accountNumber} />
                {chosen.branch && <CopyRow label="Branch" value={chosen.branch} />}
                <CopyRow label="Amount" value={String(total)} />
              </dl>
              : <figure className="checkout-qr">
                <img src={chosen.image} alt={`${chosen.label}${chosen.sample ? ' (sample, not a real payment code)' : ''}`} width="240" height="240" />
                <figcaption>{chosen.label}. Amount: {formatRs(total)}</figcaption>
              </figure>}
            {details.note && <p className="checkout-hint">{details.note}</p>}
          </>}
      <div className="checkout-actions">
        <button type="button" className="checkout-secondary" onClick={() => setStep('confirm')}>Back</button>
        <button type="button" className="checkout-primary" disabled={!chosen} onClick={() => setStep('proof')}>I’ve paid, upload screenshot</button>
      </div>
    </div>}

    {step === 'proof' && <form className="checkout-body" onSubmit={submit}>
      <p className="checkout-required"><strong>A screenshot of your payment is required.</strong> We use it to check your payment before we start your plan.</p>
      <div className={`checkout-upload${proof.url ? ' is-ready' : ''}`}>
        <label htmlFor="checkout-proof">Payment screenshot <span className="checkout-required-mark">(required)</span></label>
        <p id="checkout-proof-help">A screenshot or photo of the payment confirmation, showing the amount and date. JPG, PNG or WebP, up to 8 MB.</p>
        <input id="checkout-proof" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} disabled={proof.uploading || sending} aria-describedby="checkout-proof-help" aria-required="true" />
        {proof.preview && <div className="checkout-proof-preview"><img src={proof.preview} alt="Your payment screenshot" /><span role="status">{proof.uploading ? `Uploading ${proof.name}…` : proof.url ? `${proof.name} uploaded` : ''}</span></div>}
        {proof.error && <p className="checkout-error" role="alert">{proof.error}</p>}
      </div>
      <label className="checkout-field">Transaction ID or reference <span>(optional)</span>
        <input type="text" value={reference} maxLength={120} onChange={event => setReference(event.target.value)} placeholder="From your bank or wallet app" />
      </label>
      <label className="checkout-field">Note for us <span>(optional)</span>
        <textarea rows={2} value={note} maxLength={500} onChange={event => setNote(event.target.value)} placeholder="Anything we should know about this payment" />
      </label>
      {error && <p className="checkout-error" role="alert">{error}</p>}
      <div className="checkout-actions">
        <button type="button" className="checkout-secondary" onClick={() => setStep('pay')} disabled={sending}>Back</button>
        <button type="submit" className="checkout-primary" disabled={!proof.url || proof.uploading || sending}>{sending ? 'Sending…' : 'Send payment for checking'}</button>
      </div>
      {!proof.url && !proof.uploading && <p className="checkout-hint">Upload your screenshot to continue.</p>}
    </form>}

    {step === 'done' && <div className="checkout-body">
      <p className="checkout-intro">We’ll check your {METHODS[method].title.toLowerCase()} of {formatRs(total)} and start your {plan.label} plan, usually within a day. Your plan appears on the pricing page as soon as it starts.{liveClass ? ' We’ll also be in touch to arrange your live classes.' : ''}</p>
      <div className="checkout-actions"><button type="button" className="checkout-primary" onClick={onClose}>Done</button></div>
    </div>}
  </dialog>;
}
