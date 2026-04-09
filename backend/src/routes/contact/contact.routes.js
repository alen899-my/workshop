const express = require('express');
const router = express.Router();
const contactController = require('../../controllers/contact/contact.controller');

// @route   POST /api/contact
// @desc    Handle landpage inquiries
router.post('/', contactController.handleInquiry);

module.exports = router;
