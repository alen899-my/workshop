const express = require('express');
const router = express.Router();
const roleController = require('../../controllers/role/role.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET /api/roles
router.get('/', authenticate, authorize('view:role'), roleController.getRoles);

// @route   GET /api/roles/:id
router.get('/:id', roleController.getRoleById);

// @route   POST /api/roles
router.post('/', roleController.createRole);

// @route   PUT /api/roles/:id
router.put('/:id', roleController.updateRole);

// @route   DELETE /api/roles/:id
router.delete('/:id', roleController.deleteRole);

module.exports = router;
