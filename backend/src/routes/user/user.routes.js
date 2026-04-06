const express = require('express');
const router = express.Router();
const userController = require('../../controllers/user/user.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize, authorizeOrSelf } = require('../../middleware/rbac.middleware');

// @route   GET /api/users
router.get('/', authenticate, userController.getUsers);

// @route   GET /api/users/:id
router.get('/:id', authenticate, authorizeOrSelf('view:users'), userController.getUserById);

// @route   POST /api/users
router.post('/', authenticate, authorize('create:users'), userController.createUser);

const { upload } = require('../../middleware/upload');

// @route   PUT /api/users/:id
router.put('/:id', authenticate, authorizeOrSelf('edit:users'), upload.single('profile_image'), userController.updateUser);

// @route   DELETE /api/users/:id
router.delete('/:id', authenticate, authorize('delete:users'), userController.deleteUser);

module.exports = router;
