const User = require('../models/User');
const { sendEmail } = require('./emailTransport');
const { findPlan } = require('./plans');

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const rupees = amount => `Rs ${Number(amount).toLocaleString('en-IN')}`;

function planRequestMessage({ student, request, changedFrom, adminUrl }) {
  const plan = findPlan(request.plan);
  const label = plan ? plan.label : request.plan;
  const heading = changedFrom ? `${student.name} switched to the ${label} plan` : `${student.name} chose the ${label} plan`;
  const changeLine = changedFrom ? `Changed from: ${findPlan(changedFrom)?.label || changedFrom}` : '';
  const text = [
    `${heading}.`,
    '',
    `Student: ${student.name}`,
    `Email: ${student.email}`,
    `Plan: ${label} (${request.days} days, every course)`,
    `Amount to collect: ${rupees(request.price)}`,
    changeLine,
    '',
    'Next steps:',
    '1. Reply to this email to send the student payment details.',
    '2. When the payment arrives, open Plan requests and click "Payment received · Start plan".',
    adminUrl,
  ].filter(line => line !== '').join('\n');
  const row = (name, value) => `<tr><td style="padding:6px 16px 6px 0;color:#70675b;font-size:14px;">${name}</td><td style="padding:6px 0;font-size:15px;color:#2a2320;"><strong>${value}</strong></td></tr>`;
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e6dcc6;border-radius:12px;background:#faf6ec;">
      <p style="margin:0 0 8px;color:#a92316;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;">New plan request</p>
      <h2 style="margin:0 0 16px;color:#2a2320;font-size:20px;">${escapeHtml(heading)}</h2>
      <table style="border-collapse:collapse;margin-bottom:16px;">
        ${row('Student', escapeHtml(student.name))}
        ${row('Email', `<a href="mailto:${escapeHtml(student.email)}" style="color:#a92316;">${escapeHtml(student.email)}</a>`)}
        ${row('Plan', `${escapeHtml(label)} · ${request.days} days, every course`)}
        ${row('Amount to collect', rupees(request.price))}
        ${changedFrom ? row('Changed from', escapeHtml(findPlan(changedFrom)?.label || changedFrom)) : ''}
      </table>
      <p style="margin:0 0 8px;font-size:14px;color:#2a2320;line-height:1.5;"><strong>Reply to this email</strong> to send ${escapeHtml(student.name)} the payment details.</p>
      <p style="margin:0 0 20px;font-size:14px;color:#2a2320;line-height:1.5;">When the payment arrives, start the plan from Plan requests.</p>
      <a href="${escapeHtml(adminUrl)}" style="display:inline-block;padding:12px 20px;border-radius:8px;background:#a92316;color:#ffffff;font-weight:700;text-decoration:none;">Open plan requests</a>
      <hr style="border:none;border-top:1px solid #e6dcc6;margin:24px 0 12px;" />
      <p style="margin:0;font-size:12px;color:#999;">Xiao Ao · Chinese Made Simple</p>
    </div>`;
  return { subject: `${changedFrom ? 'Plan changed' : 'New plan request'}: ${student.name} · ${label} · ${rupees(request.price)}`, text, html };
}

// Emails every super admin about a plan request, with replies going to the student.
async function notifyPlanRequest({ studentId, request, changedFrom = null }) {
  const [student, admins] = await Promise.all([
    User.findById(studentId).select('name email'),
    User.find({ role: 'superadmin' }).select('email'),
  ]);
  if (!student) return { sent: 0 };
  const recipients = [...new Set(admins.map(admin => admin.email).filter(Boolean))];
  const adminUrl = `${(process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')}/admin/subscriptions`;
  const message = planRequestMessage({ student, request, changedFrom, adminUrl });
  const results = await Promise.allSettled(recipients.map(to => sendEmail(
    { to, replyTo: student.email, ...message },
    `Plan request email for ${to}: ${message.subject}`,
  )));
  results.filter(result => result.status === 'rejected').forEach(result => console.error('Plan request email failed:', result.reason?.message || result.reason));
  return { sent: results.filter(result => result.status === 'fulfilled').length, recipients: recipients.length };
}

module.exports = { notifyPlanRequest, planRequestMessage };
