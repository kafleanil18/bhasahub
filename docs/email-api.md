Keep the existing Vercel frontend and Render backend hosting plan. Super admins can configure HTTPS email delivery under **Email settings → Email API for free hosting**. Both supported providers use HTTPS, avoiding outbound SMTP port restrictions.

**Resend:** create an account, verify a domain you own, and choose a sender address on that exact domain. The setup check lists domains, so use a Full access API key for this workflow. Gmail addresses, the `resend.dev` test sender, and Vercel subdomains are not accepted for student mail. [Resend sender restrictions](https://resend.com/docs/knowledge-base/403-error-resend-dev-domain).

**Brevo:** create an account, add and verify the exact sender email, complete any required account approval, and create an API key. The setup check reads the sender list and requires the selected sender to be active. [Brevo sender setup](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email).

Enter provider, sender email/name, and API key, enable HTTPS delivery, and save. **Check provider** makes read-only API calls; it sends no email and saves no changes. An enabled configuration takes priority over saved Google SMTP and environment providers for verification, password resets, and manual practice reminders. Google credentials remain unchanged. Disabling HTTPS delivery restores the previously configured provider, if any.

Keys are encrypted using the same stable `EMAIL_SETTINGS_KEY` / `JWT_SECRET` configuration as Google SMTP and stored in a separate private collection. API responses expose only `hasApiKey`; blank keys preserve the existing key for the same provider. Changing provider requires a new key. A failed first-time activation is saved as an inactive draft with an actionable warning. Failed changes to an active configuration preserve the previous working settings.

No hosting or provider billing plan is changed. Sender/domain verification, account approval, provider quotas, and any domain registration costs remain the account owner's responsibility. This feature does not send reminder emails until the super admin reviews and confirms a campaign.
