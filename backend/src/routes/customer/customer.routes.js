const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/customer/customer.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

// Publicly check and then protect if needed
router.get('/', authenticate, customerController.getCustomers);
router.get('/:id', authenticate, authorize('view:customers'), customerController.getCustomerById);
router.post('/', authenticate, authorize('create:customers'), customerController.createCustomer);
router.put('/:id', authenticate, authorize('edit:customers'), customerController.updateCustomer);
router.delete('/:id', authenticate, authorize('delete:customers'), customerController.deleteCustomer);

module.exports = router;
