const express = require('express');
const router = express.Router();
const { getDashboard, getSellers, approveSeller, toggleUserStatus, getUsers, createCoupon } = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const adminOnly = [protect, authorize('admin')];

router.get('/dashboard', ...adminOnly, getDashboard);
router.get('/users', ...adminOnly, getUsers);
router.patch('/users/:id/toggle', ...adminOnly, toggleUserStatus);
router.get('/sellers', ...adminOnly, getSellers);
router.patch('/sellers/:id/approve', ...adminOnly, approveSeller);
router.post('/coupons', ...adminOnly, createCoupon);

module.exports = router;
