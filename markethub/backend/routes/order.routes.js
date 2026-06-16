const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders, getOrder, updateOrderItemStatus } = require('../controllers/order.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/', protect, authorize('buyer'), createOrder);
router.get('/', protect, getMyOrders);
router.get('/:id', protect, getOrder);
router.patch('/:id/status', protect, authorize('seller', 'admin'), updateOrderItemStatus);

module.exports = router;
