Email verification is required on the first password sign-in for newly registered accounts. Registration sets `emailVerified: false`. Login sends a six-digit code and returns `verificationRequired` without a session token. Submitting the same email and password with `otp` verifies the code and signs in. Verified accounts sign in normally afterward.

Codes expire after 10 minutes and are stored as SHA-256 hashes, separately from password-reset codes. A successful verification atomically marks the account verified and removes the code. Resending uses the login endpoint without `otp`, with a 60-second cooldown. Authentication requests retain the existing 15-per-15-minute IP limit.

Existing accounts without the verification field retain their login access. Google sign-in accepts Google's verified email and marks any pending local verification complete.

Configure [SMTP](smtp.md), or set `RESEND_API_KEY` and `EMAIL_FROM` with a sender authorized by Resend. SMTP takes precedence when configured. Delivery errors prevent login and let the user retry. Without either provider in local development, codes are printed in the server terminal; production requires email delivery to be configured. Codes are never returned by the first-login API.

Validation: `cd server && npm test`; `cd client && npm run build && npm run lint`.
