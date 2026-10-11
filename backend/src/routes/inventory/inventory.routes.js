const router = require('express').Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const controller = require('../../controllers/inventory/inventory.controller');

router.use(authenticate);
router.get('/shops', authorize('view:inventory'), controller.shops);
router.get('/', authorize('view:inventory'), controller.list);
router.get('/:id/movements', authorize('view:inventory'), controller.history);
router.post('/', authorize('manage:inventory'), controller.create);
router.put('/:id', authorize('manage:inventory'), controller.update);
router.post('/:id/stock', authorize('manage:inventory'), controller.adjust);
module.exports = router;
