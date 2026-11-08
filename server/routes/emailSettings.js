const express = require('express');
const nodemailer = require('nodemailer');
const EmailSettings = require('../models/EmailSettings');
const settings = require('../utils/googleSmtpSettings');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();
router.use(requireAuth, requireSuperAdmin);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });

router.get('/', async (_req, res) => {
  try {
    res.json(settings.publicSettings(await settings.readSettings()));
  } catch {
    res.status(500).json({ error: 'Could not load email settings. Please try again.' });
  }
});

function fail(res, error) {
  if (error instanceof settings.SettingsValidationError) return res.status(400).json({ error: error.message });
  // Provider errors can contain connection details; never return or log them.
  return res.status(502).json({ error: 'Could not verify or save Google SMTP. Check the email address, app password, and server network access, then try again.' });
}

router.put('/', async (req, res) => {
  try {
    const current = await settings.readSettings();
    const draft = { ...settings.prepareSettings(req.body, current), connectionError: '' };
    if (draft.enabled) {
      try { await nodemailer.createTransport(settings.googleDelivery(draft).options).verify(); }
      catch (error) {
        // Preserve a working configuration, but retain a new setup as an inactive draft.
        if (current?.enabled) throw error;
        draft.enabled = false;
        draft.connectionError = error.code === 'EAUTH'
          ? 'Settings saved, but Google rejected authentication. Check your Google email and app password, then enable SMTP and save again.'
          : 'Settings saved, but Google SMTP could not be reached or verified. SMTP remains disabled. Check that your hosting plan allows outbound ports 465 or 587, then enable SMTP and save again.';
      }
    }
    await EmailSettings.findOneAndUpdate({ key: 'google-smtp' }, { $set: draft }, { upsert: true, new: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'email-settings', label: `Google SMTP ${draft.enabled ? 'enabled' : 'disabled'}` });
    res.json(settings.publicSettings(draft));
  } catch (error) { fail(res, error); }
});

router.post('/test-connection', async (req, res) => {
  try {
    const draft = settings.prepareSettings(req.body, await settings.readSettings());
    await nodemailer.createTransport(settings.googleDelivery(draft).options).verify();
    res.json({ message: 'Google SMTP connection and authentication succeeded. No email was sent. Save your settings to apply any changes.' });
  } catch (error) { fail(res, error); }
});

module.exports = router;
