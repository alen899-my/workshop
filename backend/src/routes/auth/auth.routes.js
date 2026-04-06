const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.controller');

// @route   POST /api/auth/register-shop
// @desc    Register a new workshop and owner
router.post('/register-shop', authController.registerShop);

// @route   POST /api/auth/login
// @desc    Login workshop owner
router.post('/login', authController.login);

// @route   POST /api/auth/forgot-password
// @desc    Request a password reset link
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password with a valid token
router.post('/reset-password', authController.resetPassword);

module.exports = router;
