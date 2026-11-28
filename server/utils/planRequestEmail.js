const User = require('../models/User');
const { sendEmail } = require('./emailTransport');
const { findPlan } = require('./plans');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const rupees = amount => `Rs ${Number(amount).toLocaleString('en-IN')}`;

const METHODS = { bank: 'Bank transfer', qr: 'Merchant QR / eSewa' };

function planRequestMessage({ student, request, changedFrom, adminUrl }) {
  const plan = findPlan(request.plan);
  const label = plan ? plan.label : request.plan;
  const payment = request.payment?.screenshot ? request.payment : null;
  const heading = payment ? `${student.name} paid for the ${label} plan` : changedFrom ? `${student.name} switched to the ${label} plan` : `${student.name} chose the ${label} plan`;
  const live = request.liveClass && request.liveClassPrice > 0;
  const total = Number(request.price) + (live ? Number(request.liveClassPrice) : 0);
  const changeLine = changedFrom ? `Changed from: ${findPlan(changedFrom)?.label || changedFrom}` : '';
  const text = [
    `${heading}.`,
    '',
    `Student: ${student.name}`,
    `Email: ${student.email}`,
    `Plan: ${label} (${request.days} days, every course)`,
    live ? `Breakdown: plan ${rupees(request.price)} + live classes (${label}) ${rupees(request.liveClassPrice)}` : '',
    `${payment ? 'Amount paid' : 'Amount to collect'}: ${rupees(total)}`,
    payment ? `Paid by: ${METHODS[payment.method] || payment.method}` : '',
    payment?.reference ? `Transaction ID: ${payment.reference}` : '',
    payment?.note ? `Note: ${payment.note}` : '',
    payment ? `Payment screenshot: ${payment.screenshot}` : '',
    changeLine,
    '',
    'Next steps:',
    ...(payment
      ? ['1. Check the screenshot against your bank or merchant account.', '2. Open Plan requests and click "Payment checked, start plan".']
      : ['1. Reply to this email to send the student payment details.', '2. When the payment arrives, open Plan requests and start the plan.']),
    adminUrl,
  ].filter(line => line !== '').join('\n');
  const row = (name, value) => `<tr><td style="padding:6px 16px 6px 0;color:#70675b;font-size:14px;">${name}</td><td style="padding:6px 0;font-size:15px;color:#2a2320;"><strong>${value}</strong></td></tr>`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e6dcc6;border-radius:12px;background:#faf6ec;">
      <p style="margin:0 0 8px;color:#a92316;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">${payment ? 'New plan payment' : 'New plan request'}</p>
      <h2 style="margin:0 0 16px;color:#2a2320;font-size:20px;">${escapeHtml(heading)}</h2>
      <table style="border-collapse:collapse;margin-bottom:16px;">
        ${row('Student', escapeHtml(student.name))}
        ${row('Email', `<a href="mailto:${escapeHtml(student.email)}" style="color:#a92316;">${escapeHtml(student.email)}</a>`)}
        ${row('Plan', `${escapeHtml(label)} · ${request.days} days, every course`)}
        ${live ? row('Live classes', `Yes, ${escapeHtml(label)} · ${rupees(request.liveClassPrice)}`) : ''}
        ${row(payment ? 'Amount paid' : 'Amount to collect', live ? `${rupees(total)} (plan ${rupees(request.price)} + live classes ${rupees(request.liveClassPrice)})` : rupees(total))}
        ${payment ? row('Paid by', escapeHtml(METHODS[payment.method] || payment.method)) : ''}
        ${payment?.reference ? row('Transaction ID', escapeHtml(payment.reference)) : ''}
        ${payment?.note ? row('Note', escapeHtml(payment.note)) : ''}
        ${changedFrom ? row('Changed from', escapeHtml(findPlan(changedFrom)?.label || changedFrom)) : ''}
      </table>
      ${payment ? `<p style="margin:0 0 16px;"><a href="${escapeHtml(payment.screenshot)}" style="color:#a92316;font-weight:700;">Open the payment screenshot</a></p>
      <p style="margin:0 0 20px;font-size:14px;color:#2a2320;line-height:1.5;">Check it against your account, then start the plan from Plan requests.</p>` : `<p style="margin:0 0 8px;font-size:14px;color:#2a2320;line-height:1.5;"><strong>Reply to this email</strong> to send ${escapeHtml(student.name)} the payment details.</p>
      <p style="margin:0 0 20px;font-size:14px;color:#2a2320;line-height:1.5;">When the payment arrives, start the plan from Plan requests.</p>`}
      <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#a92316;color:#ffffff;font-weight:700;text-decoration:none;">Open plan requests</a>
      <hr style="border:none;border-top:1px solid #e6dcc6;margin:24px 0 12px;" />
      <p style="margin:0;font-size:12px;color:#999;">Xiao Ao, Chinese made simple</p>
    </div>`;
  const kind = payment ? 'Plan payment' : changedFrom ? 'Plan changed' : 'New plan request';
  return { subject: `${kind}: ${student.name} · ${label}${live ? ' + live classes' : ''} · ${rupees(total)}`, text, html };
}

// Emails every super admin about a plan request, with replies going to the student.
async function notifyPlanRequest({ studentId, request, changedFrom = null }) {
  const [student, admins] = await Promise.all([
    User.findById(studentId).select('name email'),
    User.find({ role: 'superadmin' }).select('email'),
  ]);
  if (!student) return { sentTo: [], error: 'The student account no longer exists.' };
  const recipients = [...new Set(admins.map(admin => admin.email).filter(Boolean))];
  if (!recipients.length) return { sentTo: [], error: 'No super admin account has an email address.' };
  const adminUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')}/admin/subscriptions`;
  const message = planRequestMessage({ student, request, changedFrom, adminUrl });
  const results = await Promise.allSettled(recipients.map(to => sendEmail(
    { to, replyTo: student.email, ...message },
    `Plan request email for ${to}: ${message.subject}`,
  )));
  const failures = results.map((result, index) => result.status === 'rejected' ? `${recipients[index]}: ${result.reason?.message || result.reason}` : null).filter(Boolean);
  failures.forEach(failure => console.error('Plan request email failed:', failure));
  return { sentTo: recipients.filter((_, index) => results[index].status === 'fulfilled'), error: failures.join('; ') };
}

// Sends the email and stores the outcome on the request.
async function notifyAndRecord(PlanRequest, { studentId, request, changedFrom = null }) {
  let outcome;
  try { outcome = await notifyPlanRequest({ studentId, request, changedFrom }); }
  catch (err) { outcome = { sentTo: [], error: err.message || 'Email could not be sent.' }; console.error('Plan request email failed:', outcome.error); }
  const adminEmail = { sentTo: outcome.sentTo, error: outcome.error || '', at: new Date() };
  await PlanRequest.updateOne({ _id: request._id }, { $set: { adminEmail } }).catch(err => console.error('Could not save plan email status:', err.message));
  return adminEmail;
}

module.exports = { notifyPlanRequest, notifyAndRecord, planRequestMessage };
