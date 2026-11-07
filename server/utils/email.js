const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    // Lets local dev work without a Resend account configured.
    console.warn('RESEND_API_KEY not set; skipping email. Reset URL:', resetUrl);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject: 'Reset your password',
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
    `,
  });
}

async function sendPasswordResetOtpEmail(to, otp) {
  if (!resend) {
    console.warn(`\n========================================\n🔑 PASSWORD RESET OTP for ${to}: [ ${otp} ]\n(Expires in 10 minutes)\n========================================\n`);
    return;
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject: `Your Xiao Ao Verification Code: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2dcd2; border-radius: 12px; background: #faf7f0;">
        <h2 style="color: #c2402a; margin-top: 0;">Xiao Ao Password Reset</h2>
        <p style="font-size: 15px; color: #333; line-height: 1.5;">We received a request to reset your password. Use the 6-digit verification code below to proceed:</p>
        <div style="text-align: center; margin: 28px 0;">
          <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #2e6b57; background: #ffffff; padding: 12px 28px; border-radius: 8px; border: 2px dashed #2e6b57;">
            ${otp}
          </span>
        </div>
        <p style="font-size: 13px; color: #666; line-height: 1.4;">This code is valid for <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e2dcd2; margin: 24px 0;" />
        <p style="font-size: 12px; color: #999; margin-bottom: 0;">Xiao Ao · Chinese Made Simple</p>
      </div>
    `,
  });
}

async function sendEmailVerificationOtp(to, otp) {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') throw new Error('Email delivery is not configured');
    console.warn(`Email verification code for ${to}: ${otp} (expires in 10 minutes)`);
    return;
  }
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    to,
    subject: 'Verify your Xiao Ao email',
    text: `Your Xiao Ao verification code is ${otp}. It expires in 10 minutes. Enter it to complete your first sign-in. If you did not request this, ignore this email.`,
  });
  if (error) throw new Error('Verification email delivery failed');
}

module.exports = { sendPasswordResetEmail, sendPasswordResetOtpEmail, sendEmailVerificationOtp };
