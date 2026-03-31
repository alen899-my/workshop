const express = require('express');
const router = express.Router();
const vehicleController = require('../../controllers/vehicle/vehicle.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { authorize } = require('../../middleware/rbac.middleware');

router.get('/', authenticate, vehicleController.getVehicles);
router.get('/:id', authenticate, authorize('view:vehicles'), vehicleController.getVehicleById);
router.get('/number/:vNumber', authenticate, vehicleController.getVehicleByNumber);
router.post('/', authenticate, authorize('create:vehicle'), vehicleController.createVehicle);
router.put('/:id', authenticate, authorize('edit:vehicle'), vehicleController.updateVehicle);
router.delete('/:id', authenticate, authorize('delete:vehicle'), vehicleController.deleteVehicle);

module.exports = router;
