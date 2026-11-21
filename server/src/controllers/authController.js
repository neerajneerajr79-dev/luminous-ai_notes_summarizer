const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/response');
const env = require('../config/env');

const COOKIE_OPTIONS = {
  httpOnly: env.cookie.httpOnly,
  secure: env.cookie.secure,
  sameSite: env.cookie.sameSite,
  maxAge: env.cookie.maxAge,
};

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  preferences: user.preferences,
  createdAt: user.createdAt,
});

function signToken(userId) {
  return jwt.sign({ id: userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function setAuthCookie(res, token) {
  res.cookie(env.cookie.name, token, COOKIE_OPTIONS);
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password) {
    throw ApiError.badRequest('Name, email and password are all required');
  }
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    throw ApiError.badRequest('Please provide a valid email address');
  }
  if (password.length < 8) {
    throw ApiError.badRequest('Password must be at least 8 characters long');
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) throw ApiError.conflict('An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), passwordHash });

  setAuthCookie(res, signToken(user._id));
  ok(res, { user: sanitizeUser(user) }, 201);
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email?.trim() || !password) {
    throw ApiError.badRequest('Email and password are required');
  }
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const matches = await user.comparePassword(password);
  if (!matches) throw ApiError.unauthorized('Invalid email or password');

  setAuthCookie(res, signToken(user._id));
  ok(res, { user: sanitizeUser(user) });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  res.clearCookie(env.cookie.name, { ...COOKIE_OPTIONS, maxAge: 0 });
  ok(res, { message: 'Logged out' });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  ok(res, { user: sanitizeUser(req.user) });
});

// PATCH /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar, preferences } = req.body || {};
  if (name !== undefined) {
    if (!name?.trim()) throw ApiError.badRequest('Name cannot be empty');
    req.user.name = name.trim();
  }
  if (avatar !== undefined) req.user.avatar = String(avatar);
  if (preferences?.theme !== undefined) {
    if (!['light', 'dark'].includes(preferences.theme)) {
      throw ApiError.badRequest('Invalid theme preference');
    }
    req.user.preferences.theme = preferences.theme;
  }
  await req.user.save();
  ok(res, { user: sanitizeUser(req.user) });
});

// PATCH /api/auth/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    throw ApiError.badRequest('Current and new password are required');
  }
  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long');
  }
  const matches = await req.user.comparePassword(currentPassword);
  if (!matches) throw ApiError.unauthorized('Current password is incorrect');

  req.user.passwordHash = await bcrypt.hash(newPassword, 12);
  await req.user.save();
  ok(res, { message: 'Password updated' });
});

// POST /api/auth/forgot-password
// Issues a reset token. In development the token is logged server-side; no
// SMTP configuration is required. The response never reveals account existence.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body || {};
  if (!email?.trim()) throw ApiError.badRequest('Email is required');

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  // Do not reveal account existence.
  if (!user) {
    return ok(res, { message: 'If that account exists, a reset link has been generated.' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  user.resetToken = token;
  user.resetTokenExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  if (env.nodeEnv === 'development') {
    console.log(`[Auth] Password reset token for ${user.email}: ${token}`);
  }
  ok(res, { message: 'If that account exists, a reset link has been generated.' });
});

// POST /api/auth/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) throw ApiError.badRequest('Token and new password are required');
  if (newPassword.length < 8) {
    throw ApiError.badRequest('New password must be at least 8 characters long');
  }
  const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
  if (!user) throw ApiError.badRequest('Reset token is invalid or has expired');

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.resetToken = '';
  user.resetTokenExpires = undefined;
  await user.save();
  ok(res, { message: 'Password has been reset. You can now log in.' });
});

module.exports = {
  register,
  login,
  logout,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  sanitizeUser,
};
