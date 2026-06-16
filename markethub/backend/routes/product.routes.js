const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct } = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { productValidator } = require('../middleware/validation.middleware');

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', protect, authorize('seller'), productValidator, createProduct);
router.put('/:id', protect, authorize('seller'), updateProduct);
router.delete('/:id', protect, authorize('seller'), deleteProduct);

module.exports = router;
