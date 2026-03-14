const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', warehouseController.getWarehouses);
router.post('/', requireRoles('manager'), warehouseController.createWarehouse);
router.get('/:warehouse_id/locations', warehouseController.getInventoryLocations);
router.post('/locations', requireRoles('manager'), warehouseController.createInventoryLocation);

module.exports = router;
