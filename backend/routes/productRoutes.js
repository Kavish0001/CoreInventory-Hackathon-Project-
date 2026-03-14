const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middleware/authMiddleware');
const { requireRoles } = require('../middleware/rbacMiddleware');

router.use(authMiddleware);

router.get('/', productController.getProducts);
router.post('/', requireRoles('manager'), productController.createProduct);
router.get('/:id', productController.getProductById);
router.put('/:id', requireRoles('manager'), productController.updateProduct);

module.exports = router;
