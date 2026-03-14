const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/receipts', inventoryController.createReceipt);
router.post('/deliveries', inventoryController.createDelivery);
router.post('/transfers', inventoryController.createTransfer);
router.post('/adjustments', inventoryController.createAdjustment);

module.exports = router;
