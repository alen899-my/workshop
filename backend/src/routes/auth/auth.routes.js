const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/auth.controller');

// @route   POST /api/auth/register-shop
// @desc    Register a new workshop and owner
router.post('/register-shop', authController.registerShop);

// @route   POST /api/auth/login
// @desc    Login workshop owner
router.post('/login', authController.login);

module.exports = router;
