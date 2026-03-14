const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/ledger', reportController.getStockLedger);
router.get('/low-stock', reportController.getLowStockAlerts);

module.exports = router;
