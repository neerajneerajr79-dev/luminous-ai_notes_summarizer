const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

// Verifies the HTTP-only cookie and attaches the user to the request.
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.[env.cookie.name];
    if (!token) return next(ApiError.unauthorized('Not authenticated'));

    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return next(ApiError.unauthorized('User no longer exists'));

    req.user = user;
    next();
  } catch {
    next(ApiError.unauthorized('Invalid or expired session'));
  }
};

module.exports = { authMiddleware };
