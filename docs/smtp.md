SMTP sends first-login verification codes, password reset codes, and password reset links through the same server configuration.

The same service also sends [manual practice reminders to subscribed students](practice-reminders.md) from the super admin page.

Super admins can configure Google SMTP from **Settings → Email settings** (`/admin/settings/email`). Enter the Google email address, sender name, and a Google app password, enable Google SMTP, and save. The server verifies the connection before enabling it. **Test connection** verifies the form without sending mail or saving changes. Both Gmail and Google Workspace addresses are accepted; the Google account must permit app passwords. See [Google's app password instructions](https://support.google.com/accounts/answer/185833), including the 2-Step Verification requirement and account restrictions.

Saved Google settings take precedence over environment-based email providers and apply to every email send immediately. Turning Google SMTP off restores the environment configuration. App passwords are encrypted with AES-256-GCM in a private MongoDB collection and never returned to the browser, public site settings, or audit log. Leaving the password field blank preserves the saved password; changing the Google email requires a new app password.

Encryption uses `EMAIL_SETTINGS_KEY`, falling back to `JWT_SECRET`. Keep the chosen secret stable across deployments and server instances. If it changes, re-enter the app password using the admin page. To switch to a separate encryption secret, set `EMAIL_SETTINGS_KEY` in the server environment before saving a password.

The command-line connection check below tests environment configuration. Use the admin page to test saved Google settings.

If a new Google setup fails its connection check during Save, its credentials are still encrypted and saved as a disabled draft. The page preserves a connection warning after reload. Resolve the authentication or hosting connection problem, enable the switch, and save again; a blank password keeps the saved credential. A failed change to an already enabled setup preserves the previous active configuration.

Add your provider's settings to `server/.env` for local development, or to your hosting service's environment variables:

```dotenv
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_REQUIRE_TLS=true
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM="Xiao Ao <verified-sender@example.com>"
```

Use the SMTP credentials issued by your provider and a sender address that provider permits. Replace any existing Resend test sender in `EMAIL_FROM`. Keep credentials in the server environment, outside source control and client environment files.

Port 587 uses STARTTLS with `SMTP_SECURE=false` and `SMTP_REQUIRE_TLS=true`. For port 465, set `SMTP_SECURE=true`; TLS starts immediately. If `SMTP_SECURE` is empty, the server infers it from the port. These settings follow [Nodemailer's SMTP configuration](https://nodemailer.com/smtp). Certificate verification stays enabled.

Authenticated servers need both `SMTP_USER` and `SMTP_PASS`. For a trusted unauthenticated relay, leave both empty and explicitly set `EMAIL_FROM`. Set `SMTP_REQUIRE_TLS=false` only when a trusted local development relay does not offer TLS.

From the repository root, check connectivity and authentication without sending email:

```sh
npm --prefix server run smtp:check
```

Restart the server after changing environment variables. Then use first-login verification or password reset with your own account to confirm actual delivery. A successful connection check does not guarantee the provider accepts your sender or that messages reach an inbox.

For Render, set these variables in the service environment; `render.yaml` includes the configuration keys. Ensure the hosting plan permits outbound SMTP to your chosen port. If port 465 is used, update both the port and `SMTP_SECURE`.

When `SMTP_HOST` is set, SMTP takes precedence over `RESEND_API_KEY`. SMTP errors are reported to the caller without switching providers. Without SMTP, the existing Resend integration remains available. Without either provider, development logs codes and links locally; production rejects delivery and never prints codes or links. The password-reset API includes `devOtp` only outside production when neither provider is configured.
