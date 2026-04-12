const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/shop/shop.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// @route   GET /api/shops/public — public search, no auth required
router.get('/public', shopController.getShops);

// @route   GET /api/shops
router.get('/', authenticate, authorize('view:shops'), shopController.getShops);

// @route   GET /api/shops/:id
router.get('/:id', authenticate, authorize('can:see:the:shop:details:and:can:edit'), shopController.getShopById);

const { upload } = require('../../middleware/upload');

// @route   POST /api/shops
router.post('/', authenticate, authorize('create:shops'), upload.single('shop_image'), shopController.createShop);

// @route   PUT /api/shops/:id
router.put('/:id', authenticate, authorize('can:see:the:shop:details:and:can:edit'), upload.single('shop_image'), shopController.updateShop);

// @route   DELETE /api/shops/:id
router.delete('/:id', authenticate, authorize('delete:shops'), shopController.deleteShop);

module.exports = router;
