const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.controller');
const { rateLimit } = require('express-rate-limit');
const { authenticate } = require('../../middleware/auth.middleware');

// The default store is per process. Multi-instance deployments must supply a
// shared store or enforce the same limits at their gateway.
const loginLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { success: false, error: 'Too many login attempts. Try again in 15 minutes.' },
});
const signupLimit = rateLimit({
  windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again in an hour.' },
});
const resetLimit = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { success: false, error: 'Too many reset requests. Try again in 15 minutes.' },
});

// @route   POST /api/auth/register-shop
// @desc    Register a new workshop and owner
router.post('/register-shop', signupLimit, authController.registerShop);

// @route   POST /api/auth/login
// @desc    Login workshop owner
router.post('/login', loginLimit, authController.login);
router.get('/session', authenticate, authController.getSession);

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset link
router.post('/forgot-password', resetLimit, authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with a valid token
router.post('/reset-password', resetLimit, authController.resetPassword);

module.exports = router;
