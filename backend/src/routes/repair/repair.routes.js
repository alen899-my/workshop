const express = require('express');
const router = express.Router();
const repairController = require('../../controllers/repair/repair.controller');
const pdfController = require('../../controllers/repair/pdf.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { upload } = require('../../middleware/upload');

// @route   GET /api/repairs/stats/summary
router.get('/stats/summary', authenticate, repairController.getDashboardStats);

// @route   GET /api/repairs
router.get('/', authenticate, authorize('view:repairs'), repairController.getRepairs);

// @route   GET /api/repairs/:id
router.get('/:id', authenticate, authorize('view:repairs'), repairController.getRepairById);

// @route   GET /api/repairs/:id/pdf
router.get('/:id/pdf', authenticate, authorize('view:repairs'), pdfController.generatePDF);

// @route   POST /api/repairs
router.post('/', authenticate, authorize('create:repair'), upload.single('vehicle_image'), repairController.createRepair);

// @route   PUT /api/repairs/:id
router.put('/:id', authenticate, authorize('edit:repair'), upload.single('vehicle_image'), repairController.updateRepair);

// @route   DELETE /api/repairs/:id
router.delete('/:id', authenticate, authorize('delete:repair'), repairController.deleteRepair);

module.exports = router;
