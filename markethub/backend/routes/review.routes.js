const express = require('express');
const router = express.Router();
const { createReview, deleteReview } = require('../controllers/review.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { reviewValidator } = require('../middleware/validation.middleware');

router.post('/', protect, authorize('buyer'), reviewValidator, createReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
