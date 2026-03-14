const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', warehouseController.getWarehouses);
router.post('/', warehouseController.createWarehouse);
router.get('/:warehouse_id/locations', warehouseController.getInventoryLocations);
router.post('/locations', warehouseController.createInventoryLocation);

module.exports = router;
