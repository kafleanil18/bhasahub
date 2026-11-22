import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInPath } from '../navigation/paths';
import { PLANS, formatRs, monthlyPrice, planLabel, savingPercent } from './plans';
import { FEATURE_GROUPS } from './features';
import './PricingPage.css';

const API = `${window.API_BASE_URL}/api/plans`;
import ContactLinks from '../components/ContactLinks';
import { CONTACT_PHONE } from '../components/contactPhone';
const formatDate = value => new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

async function call(path = '', options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}`, 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

function Check() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>;
}

export default function PricingPage({ user }) {
  const navigate = useNavigate();
  const student = user?.role === 'student';
  const staff = !!user && !student;
  const [status, setStatus] = useState({ pass: null, request: null });
  const [loading, setLoading] = useState(student);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const noticeRef = useRef(null);

  const load = useCallback(async () => {
    if (!student) return;
    try { setStatus(await call('/my')); setError(''); }
    catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [student]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (notice) noticeRef.current?.focus(); }, [notice]);

  const pending = status.request?.status === 'pending' ? status.request : null;
  const choose = async plan => {
    if (!user) { navigate(signInPath('/pricing')); return; }
    if (!student || busy) return;
    setBusy(plan.id); setError(''); setNotice('');
    try {
      const request = await call('/requests', { method: 'POST', body: JSON.stringify({ planId: plan.id }) });
      setStatus(previous => ({ ...previous, request }));
      setNotice(`Your ${plan.label} plan request is in. We’ll email you payment details for ${formatRs(plan.price)}.`);
    } catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };
  const cancel = async () => {
    if (busy) return;
    setBusy('cancel'); setError(''); setNotice('');
    try { await call('/requests/my', { method: 'DELETE' }); setStatus(previous => ({ ...previous, request: null })); setNotice('Your plan request was cancelled.'); }
    catch (err) { setError(err.message); }
    finally { setBusy(''); }
  };

  return <main className="pricing-page" aria-labelledby="pricing-title">
    <div className="container pricing-inner">
      <header className="pricing-intro">
        <p className="pricing-eyebrow">Subscription plans</p>
        <h1 id="pricing-title">One plan. <em>Every course.</em></h1>
        <p>Unlock every HSK course on the platform. The longer you learn, the less you pay each month.</p>
      </header>

      {notice && <div className="pricing-banner is-success" role="status" tabIndex={-1} ref={noticeRef}>{notice}</div>}
      {error && <div className="pricing-banner is-error" role="alert">{error}</div>}
      {student && !loading && status.pass && <div className="pricing-banner is-active" role="status"><div><strong>Your {status.pass.plan ? `${planLabel(status.pass.plan)} ` : ''}plan is active until {formatDate(status.pass.expiresAt)}.</strong> Every course is unlocked. You can choose a new plan when this one ends.</div></div>}
      {student && !loading && pending && <div className="pricing-banner is-pending" role="status">
        <div><strong>Your {planLabel(pending.plan)} plan request is waiting for payment.</strong> We’ll email you how to pay {formatRs(pending.price)}. Your courses unlock as soon as the payment is confirmed.</div>
        <button type="button" className="pricing-link" onClick={cancel} disabled={!!busy}>{busy === 'cancel' ? 'Cancelling…' : 'Cancel request'}</button>
      </div>}
      {student && !loading && status.request?.status === 'denied' && !status.pass && <div className="pricing-banner" role="status">Your last plan request wasn’t approved. You can choose a plan again, or message us if you have a question.</div>}
      {staff && <div className="pricing-banner" role="status">Admin accounts already have full access. This is the page students see.</div>}

      <section className="pricing-grid" aria-label="Plans">
        {PLANS.map(plan => {
          const activePass = student && !loading ? status.pass : null;
          const active = activePass?.plan === plan.id;
          const locked = !!activePass && !active;
          const requested = !activePass && pending?.plan === plan.id;
          const saving = savingPercent(plan);
          const featured = plan.featured && !activePass;
          return <article key={plan.id} className={`pricing-card${featured ? ' is-featured' : ''}${requested ? ' is-requested' : ''}${active ? ' is-active' : ''}${locked ? ' is-locked' : ''}`} aria-labelledby={`plan-${plan.id}`}>
            <div className="pricing-card-top">
              <h2 id={`plan-${plan.id}`}>{plan.label}</h2>
              {active ? <span className="pricing-badge is-active"><Check/> Active plan</span> : featured ? <span className="pricing-badge">Best value</span> : <span className="pricing-note">{plan.note}</span>}
            </div>
            <p className="pricing-price"><strong>{formatRs(plan.price)}</strong><span>{plan.months === 1 ? 'for 1 month' : `for ${plan.months} months`}</span></p>
            <p className="pricing-monthly">{plan.months === 1 ? 'Billed once. No auto-renewal.' : <>{formatRs(monthlyPrice(plan))} a month · <b>Save {saving}%</b></>}</p>
            {active ? <p className="pricing-active-until" role="status"><Check/> Active until {formatDate(activePass.expiresAt)}</p>
              : <button type="button" className="pricing-choose" disabled={staff || locked || requested || !!busy || loading} onClick={() => choose(plan)} aria-label={locked ? `${plan.label} plan, available when your current plan ends` : requested ? `${plan.label} plan requested` : `Choose the ${plan.label} plan, ${formatRs(plan.price)}`}>
                {busy === plan.id ? 'Sending request…' : locked ? 'Available when your plan ends' : requested ? <>Requested <Check/></> : !user ? 'Sign in to choose' : pending ? `Switch to ${plan.label}` : `Choose ${plan.label}`}
                {!requested && !locked && busy !== plan.id && <span aria-hidden="true">→</span>}
              </button>}
          </article>;
        })}
      </section>

      <section className="pricing-features" aria-labelledby="pricing-features-title">
        <header className="pricing-features-intro">
          <p className="pricing-eyebrow">What you get</p>
          <h2 id="pricing-features-title">Everything on the platform</h2>
          <p>Courses, exam practice, nine practice tools and progress tracking, all in one place. A plan unlocks every HSK course. The practice studio and mock tests are open to everyone with a free account.</p>
        </header>
        <div className="pricing-feature-groups">
          {FEATURE_GROUPS.map(group => <article key={group.id} className={`pricing-feature-group is-${group.id}`} aria-labelledby={`features-${group.id}`}>
            <div className="pricing-feature-head">
              <span className="pricing-feature-mark" lang="zh-CN" aria-hidden="true">{group.mark}</span>
              <div><h3 id={`features-${group.id}`}>{group.title}</h3><p>{group.summary}</p></div>
            </div>
            <ul>{group.items.map(([title, description, tag]) => <li key={title}><Check/><div><strong>{title}{tag && <span className="pricing-feature-tag">{tag}</span>}</strong><span>{description}</span></div></li>)}</ul>
            {group.action && CONTACT_PHONE && <div className="pricing-feature-action"><span>{group.action}</span><ContactLinks/></div>}
          </article>)}
        </div>
      </section>

      <section className="pricing-steps" aria-labelledby="pricing-steps-title">
        <h2 id="pricing-steps-title">How it works</h2>
        <ol>
          <li><span aria-hidden="true">1</span><div><strong>Choose a plan</strong><p>Pick 1, 3 or 6 months. You can switch until it’s confirmed.</p></div></li>
          <li><span aria-hidden="true">2</span><div><strong>Pay</strong><p>We’ll email you payment details.</p></div></li>
          <li><span aria-hidden="true">3</span><div><strong>Start learning</strong><p>Every course unlocks as soon as your payment is confirmed.</p></div></li>
        </ol>
      </section>
    </div>
  </main>;
}
