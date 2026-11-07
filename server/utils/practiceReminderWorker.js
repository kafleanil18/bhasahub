const crypto = require('crypto');
const PracticeReminder = require('../models/PracticeReminder');
const reminders = require('./practiceReminders');
const email = require('./emailTransport');

async function recoverInterruptedDeliveries(now = new Date()) {
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000);
  // The provider may have accepted an interrupted send. Do not send it again.
  await PracticeReminder.updateMany({ recipients: { $elemMatch: { status: 'sending', attemptedAt: { $lt: cutoff } } } }, {
    $set: { 'recipients.$[recipient].status': 'uncertain' },
  }, { arrayFilters: [{ 'recipient.status': 'sending', 'recipient.attemptedAt': { $lt: cutoff } }] });
}

async function processNextReminder() {
  const claimId = crypto.randomUUID();
  const campaign = await PracticeReminder.findOneAndUpdate({ 'recipients.status': 'pending' }, {
    $set: { 'recipients.$.status': 'sending', 'recipients.$.claimId': claimId, 'recipients.$.attemptedAt': new Date() },
  }, {
    sort: { createdAt: 1 }, new: true,
    projection: { subject: 1, message: 1, clientUrl: 1, recipients: { $elemMatch: { claimId } } },
  }).lean();
  if (!campaign) return false;
  const recipient = campaign.recipients.find(item => item.claimId === claimId);
  let status;
  try {
    const eligible = await reminders.eligibleStudents(recipient.user);
    if (!eligible.some(student => student.user === String(recipient.user) && student.email === recipient.email)) status = 'skipped';
    else {
      await email.sendEmail(reminders.reminderEmail(campaign, recipient), undefined, { requireDelivery: true });
      status = 'sent';
    }
  } catch { status = 'failed'; }
  // If saving the result fails, leave `sending` for recovery as uncertain.
  await PracticeReminder.updateOne({ _id: campaign._id, 'recipients.claimId': claimId }, { $set: { 'recipients.$.status': status } });
  return true;
}

function startPracticeReminderWorker() {
  let stopped = false;
  let timer;
  let recoveredAt = 0;
  async function tick() {
    try {
      if (Date.now() - recoveredAt > 60000) { await recoverInterruptedDeliveries(); recoveredAt = Date.now(); }
      await processNextReminder();
    } catch { console.error('Practice reminder processing is temporarily unavailable.'); }
    if (!stopped) { timer = setTimeout(tick, 2000); timer.unref(); }
  }
  timer = setTimeout(tick, 2000); timer.unref();
  return { stop() { stopped = true; clearTimeout(timer); } };
}

module.exports = { processNextReminder, recoverInterruptedDeliveries, startPracticeReminderWorker };
