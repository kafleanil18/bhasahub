require('dotenv').config({ path: require('path').join(__dirname, '..', '.env'), quiet: true });
const { verifyEmailConfiguration } = require('../utils/emailTransport');

verifyEmailConfiguration()
  .then(() => console.log('SMTP connection and authentication succeeded. No email was sent.'))
  .catch(error => {
    // Do not print credentials, connection URLs, or provider responses.
    const code = /^[A-Z_]+$/.test(error.code || '') ? ` (${error.code})` : '';
    console.error(`SMTP check failed${code}. Check the SMTP settings, credentials, and network access. See docs/smtp.md.`);
    process.exitCode = 1;
  });
