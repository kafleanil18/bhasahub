const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { sendPasswordResetEmail, sendPasswordResetOtpEmail } = require('../utils/email');

const { recordStudentSignIn } = require('../utils/studentSignIns');

const router = express.Router();

// Rate limiter for authentication attempts (max 15 attempts per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for forgot-password requests, since each one sends an email
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many password reset requests. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, password, adminCode } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const role = adminCode && process.env.ADMIN_CODE && adminCode === process.env.ADMIN_CODE ? 'admin' : 'student';

    const user = await User.create({ name, email, password: hashedPassword, role });

    res.status(201).json({ message: 'Account created', user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email || typeof password !== 'string') return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordOk = await bcrypt.compare(password, user.password || '');
    if (!passwordOk) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await recordStudentSignIn(user, 'email');
    res.json({
      message: 'Logged in',
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/google
router.post('/google', authLimiter, async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: 'Google credential token is required' });
    }

    // Verify token with Google's tokeninfo API
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    const payload = await googleRes.json();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email || (email_verified !== 'true' && email_verified !== true)) {
      return res.status(400).json({ error: 'Google account email is not verified' });
    }

    if (process.env.GOOGLE_CLIENT_ID && payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      return res.status(401).json({ error: 'Google token audience mismatch' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists by googleId or email
    let user = await User.findOne({
      $or: [{ googleId }, { email: normalizedEmail }]
    });

    if (user) {
      let updated = false;
      if (user.emailVerified === false) {
        user.emailVerified = true;
        user.emailVerificationHash = undefined;
        user.emailVerificationExpires = undefined;
        user.emailVerificationSentAt = undefined;
        updated = true;
      }
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.avatar && picture) {
        user.avatar = picture;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    } else {
      user = await User.create({
        name: name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId,
        avatar: picture,
        role: 'student',
        authProvider: 'google',
        emailVerified: true,
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    await recordStudentSignIn(user, 'google');
    res.json({
      message: 'Logged in with Google',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(500).json({ error: 'Failed to authenticate with Google' });
  }
});

// POST /api/auth/change-password — logged-in user changes their own password
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Could not change password' });
  }
});

// POST /api/auth/forgot-password — request a reset link by email
router.post('/forgot-password', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    // Always return the same message, whether or not the account exists,
    // so this endpoint can't be used to enumerate registered emails.
    const genericResponse = { message: 'If an account with that email exists, a reset link has been sent.' };

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.json(genericResponse);

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/?reset=${rawToken}`;

    await sendPasswordResetEmail(user.email, resetUrl);

    res.json(genericResponse);
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/reset-password — set a new password using a token from the emailed link
router.post('/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordTokenHash: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// POST /api/auth/send-otp — send a 6-digit OTP to the user's email
router.post('/send-otp', forgotPasswordLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    // Protect against account enumeration, but inform frontend properly
    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, an OTP code has been sent.',
        success: true
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordOtpHash = otpHash;
    user.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendPasswordResetOtpEmail(user.email, otp);

    const response = {
      message: 'A 6-digit verification code has been sent to your email.',
      success: true
    };

    // If Resend API key is not configured, provide devOtp for seamless local development
    if (!process.env.RESEND_API_KEY) {
      response.devOtp = otp;
    }

    res.json(response);
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Failed to send verification code. Please try again.' });
  }
});

// POST /api/auth/verify-otp — check if an OTP code is valid before resetting
router.post('/verify-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtpHash: otpHash,
      resetPasswordOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    res.json({ message: 'Code verified successfully', valid: true });
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong while verifying code' });
  }
});

// POST /api/auth/reset-password-otp — reset password using verified OTP
router.post('/reset-password-otp', authLimiter, async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpHash = crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordOtpHash: otpHash,
      resetPasswordOtpExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordOtpHash = undefined;
    user.resetPasswordOtpExpires = undefined;
    user.resetPasswordTokenHash = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now sign in with your new password.' });
  } catch (err) {
    console.error('Error resetting password with OTP:', err);
    res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;
