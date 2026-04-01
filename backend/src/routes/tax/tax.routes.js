const express = require('express');
const router = express.Router();
const taxController = require('../../controllers/tax/tax.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET  /api/taxes
router.get('/', authenticate, taxController.getTaxSettings);

// @route   POST /api/taxes
router.post('/', authenticate, authorize('manage:settings'), taxController.createTaxSetting);

// @route   PUT  /api/taxes/:id
router.put('/:id', authenticate, authorize('manage:settings'), taxController.updateTaxSetting);

// @route   DELETE /api/taxes/:id
router.delete('/:id', authenticate, authorize('manage:settings'), taxController.deleteTaxSetting);

module.exports = router;
