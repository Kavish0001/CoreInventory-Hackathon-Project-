const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

// List / search (list or kanban grouping in UI)
router.get('/receipts', requireRoles('manager'), inventoryController.listReceipts);
router.get('/deliveries', requireRoles('manager'), inventoryController.listDeliveries);
router.get('/transfers', inventoryController.listTransfers);
router.get('/receipts/:id', requireRoles('manager'), inventoryController.getReceipt);
router.get('/deliveries/:id', requireRoles('manager'), inventoryController.getDelivery);
router.get('/move-history', inventoryController.getMoveHistory);
router.get('/stock/by-location', inventoryController.getLocationStock);

router.post('/receipts', requireRoles('manager'), inventoryController.createReceipt);
router.post('/receipts/:id/mark-as-todo', requireRoles('manager'), inventoryController.confirmReceipt);
router.post('/receipts/:id/confirm', requireRoles('manager'), inventoryController.confirmReceipt);
router.post('/receipts/:id/validate', requireRoles('manager'), inventoryController.validateReceipt);

router.post('/deliveries', requireRoles('manager'), inventoryController.createDelivery);
router.post('/deliveries/:id/mark-as-todo', requireRoles('manager'), inventoryController.confirmDelivery);
router.post('/deliveries/:id/confirm', requireRoles('manager'), inventoryController.confirmDelivery);
router.post('/deliveries/:id/validate', requireRoles('manager'), inventoryController.validateDelivery);

router.post('/transfers', inventoryController.createTransfer);
router.post('/adjustments', inventoryController.createAdjustment);

module.exports = router;
