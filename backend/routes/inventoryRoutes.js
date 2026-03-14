const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// List / search (list or kanban grouping in UI)
router.get('/receipts', inventoryController.listReceipts);
router.get('/deliveries', inventoryController.listDeliveries);
router.get('/receipts/:id', inventoryController.getReceipt);
router.get('/deliveries/:id', inventoryController.getDelivery);
router.get('/move-history', inventoryController.getMoveHistory);

router.post('/receipts', inventoryController.createReceipt);
router.post('/receipts/:id/mark-as-todo', inventoryController.confirmReceipt);
router.post('/receipts/:id/confirm', inventoryController.confirmReceipt);
router.post('/receipts/:id/validate', inventoryController.validateReceipt);

router.post('/deliveries', inventoryController.createDelivery);
router.post('/deliveries/:id/mark-as-todo', inventoryController.confirmDelivery);
router.post('/deliveries/:id/confirm', inventoryController.confirmDelivery);
router.post('/deliveries/:id/validate', inventoryController.validateDelivery);

router.post('/transfers', inventoryController.createTransfer);
router.post('/adjustments', inventoryController.createAdjustment);

module.exports = router;
