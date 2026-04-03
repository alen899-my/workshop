const express = require('express');
const router = express.Router();
const billController = require('../../controllers/bill/bill.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET /api/bills/repair/:repairId
router.get('/repair/:repairId', authenticate, authorize('view:repairs'), billController.getBill);

// @route   POST /api/bills/repair/:repairId
router.post('/repair/:repairId', authenticate, authorize('edit:repair'), billController.saveBill);

// @route   GET /api/bills
router.get('/', authenticate, authorize('view:invoices'), billController.getAllBills);

// @route   DELETE /api/bills/:id
router.delete('/:id', authenticate, authorize('edit:repair'), billController.deleteBill);

module.exports = router;
