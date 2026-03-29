const express = require('express');
const router = express.Router();
const permissionController = require('../../controllers/permission/permission.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET /api/permissions
router.get('/', authenticate, authorize('view:permission'), permissionController.getPermissions);

// @route   GET /api/permissions/:id
router.get('/:id', authenticate, authorize('view:permission'), permissionController.getPermissionById);

// @route   POST /api/permissions
router.post('/', authenticate, authorize('create:permission'), permissionController.createPermission);

// @route   PUT /api/permissions/:id
router.put('/:id', authenticate, authorize('edit:permission'), permissionController.updatePermission);

// @route   DELETE /api/permissions/:id
router.delete('/:id', authenticate, authorize('delete:permission'), permissionController.deletePermission);

// @route   GET /api/permissions/role/:role
router.get('/role/:role', permissionController.getRolePermissions);

module.exports = router;
