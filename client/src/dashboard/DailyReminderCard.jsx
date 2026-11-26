import { useState } from 'react';
import usePushReminders, { formatTime } from '../pwa/usePushReminders';
import './DailyReminderCard.css';
import Icon from '../components/Icon';

const TIMES = Array.from({ length: 30 }, (_, index) => {
  const minutes = 6 * 60 + index * 30; // 6:00 am – 8:30 pm
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
});

export default function DailyReminderCard() {
  const reminders = usePushReminders();
  const [draftTime, setDraftTime] = useState('');
  if (['loading', 'not-configured'].includes(reminders.status)) return null;
  const on = reminders.status === 'ready' && reminders.enabled && reminders.thisDevice;
  const time = draftTime || reminders.time || '19:00';
  const blocked = reminders.permission === 'denied';
  const busy = !!reminders.busy;

  return <section className="daily-reminder" aria-labelledby="daily-reminder-title">
    <div className="daily-reminder-copy">
      <span className="daily-reminder-icon" aria-hidden="true"><Icon name="bell"/></span>
      <div>
        <h2 id="daily-reminder-title">Daily practice reminder</h2>
        <p>{on ? `On for this device at ${formatTime(reminders.time)} (${reminders.timezone}). Skipped on days you’ve already practised.` : 'Get one notification a day at a time you choose, only if you haven’t practised yet.'}</p>
      </div>
    </div>
    {reminders.status === 'ios-install' ? <p className="daily-reminder-hint">On iPhone and iPad, reminders work in the installed app. Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>, open Xiao Ao from your Home Screen, and turn reminders on there.</p>
      : reminders.status === 'unsupported' ? <p className="daily-reminder-hint">This browser can’t show notifications. Try Chrome, Edge, Firefox or Safari, or install the app.</p>
        : reminders.status === 'error' ? <div className="daily-reminder-actions"><p role="alert">{reminders.error}</p><button className="listening-secondary" onClick={reminders.retry}>Try again</button></div>
          : <>
            <div className="daily-reminder-actions">
              <label className="daily-reminder-time"><span>Remind me at</span>
                <select value={time} disabled={busy} onChange={event => { setDraftTime(event.target.value); if (on) reminders.changeTime(event.target.value); }}>
                  {[...new Set([...TIMES, time])].sort().map(value => <option key={value} value={value}>{formatTime(value)}</option>)}
                </select>
              </label>
              {on ? <>
                <button className="listening-secondary" disabled={busy} onClick={reminders.sendTest}>{reminders.busy === 'test' ? 'Sending…' : 'Send test notification'}</button>
                <button className="listening-secondary" disabled={busy} onClick={reminders.disable}>{reminders.busy === 'disable' ? 'Turning off…' : 'Turn off'}</button>
              </> : <button className="btn-primary" disabled={busy || blocked} onClick={() => reminders.enable(time)}>{reminders.busy === 'enable' ? 'Turning on…' : 'Turn on reminders'}</button>}
            </div>
            {blocked && !on && <p className="daily-reminder-hint">Notifications are blocked for this site. Allow them in your browser’s site settings (the icon next to the address), then reload this page.</p>}
            {!on && reminders.enabled && reminders.devices > 0 && <p className="daily-reminder-hint">Reminders are on for {reminders.devices === 1 ? 'another device' : `${reminders.devices} other devices`}. Turn them on here to get them on this device too.</p>}
          </>}
    {reminders.message && <p className="daily-reminder-status" role="status">{reminders.message}</p>}
    {reminders.error && reminders.status !== 'error' && <p className="daily-reminder-error" role="alert">{reminders.error}</p>}
  </section>;
}
