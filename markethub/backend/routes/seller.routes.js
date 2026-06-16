const express = require('express');
const router = express.Router();
const { getDashboard, getSellerOrders } = require('../controllers/seller.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/dashboard', protect, authorize('seller'), getDashboard);
router.get('/orders', protect, authorize('seller'), getSellerOrders);

module.exports = router;
