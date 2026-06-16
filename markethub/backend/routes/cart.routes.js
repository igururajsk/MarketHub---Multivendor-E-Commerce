const express = require('express');
const router = express.Router();
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getCart);
router.post('/', protect, addToCart);
router.delete('/clear', protect, clearCart);
router.delete('/:product_id', protect, removeFromCart);

module.exports = router;
