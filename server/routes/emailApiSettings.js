const express = require('express');
const EmailApiSettings = require('../models/EmailApiSettings');
const settings = require('../utils/emailApiSettings');
const { SettingsValidationError } = require('../utils/googleSmtpSettings');
const { requireAuth, requireSuperAdmin } = require('../middleware/auth');
const { logActivity } = require('../utils/auditLog');

const router = express.Router();
router.use(requireAuth, requireSuperAdmin);
router.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
const fail = (res, error) => res.status(error instanceof SettingsValidationError ? 400 : 502).json({ error: error instanceof SettingsValidationError ? error.message : 'Could not check or save the email API settings. Check your API key, sender verification, and provider account.' });

router.get('/', async (_req, res) => {
  try { res.json(settings.publicSettings(await settings.readSettings())); }
  catch { res.status(503).json({ error: 'Could not load email API settings. Please try again.' }); }
});
router.put('/', async (req, res) => {
  try {
    const current = await settings.readSettings();
    const draft = settings.prepareSettings(req.body, current);
    if (draft.enabled) {
      try { await settings.verifySettings(draft); }
      catch (error) {
        if (current?.enabled) return fail(res, error);
        draft.enabled = false;
        draft.connectionError = error instanceof SettingsValidationError ? error.message : 'Settings saved, but provider verification failed. Check your API key permissions, verified sender, and account status, then enable and save again.';
      }
    }
    await EmailApiSettings.findOneAndUpdate({ key: 'main' }, { $set: draft }, { upsert: true, new: true, runValidators: true });
    logActivity(req, { action: 'update', resourceType: 'email-settings', label: `${draft.provider} HTTPS email ${draft.enabled ? 'enabled' : 'disabled'}` });
    res.json(settings.publicSettings(draft));
  } catch (error) { fail(res, error); }
});
router.post('/check', async (req, res) => {
  try {
    const draft = settings.prepareSettings(req.body, await settings.readSettings());
    await settings.verifySettings(draft);
    res.json({ message: 'API access and sender verification succeeded. No email was sent. Save settings to apply changes.' });
  } catch (error) { fail(res, error); }
});

module.exports = router;
