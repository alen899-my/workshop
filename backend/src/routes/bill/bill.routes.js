const express = require('express');
const router = express.Router();
const billController = require('../../controllers/bill/bill.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET /api/bills/repair/:repairId
router.get('/repair/:repairId', authenticate, authorize('view:repairs'), billController.getBill);

// @route   POST /api/bills/repair/:repairId
router.post('/repair/:repairId', authenticate, authorize('edit:repair'), billController.saveBill);

module.exports = router;
