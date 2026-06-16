const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/cart.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getWishlist);
router.post('/toggle', protect, toggleWishlist);

module.exports = router;
