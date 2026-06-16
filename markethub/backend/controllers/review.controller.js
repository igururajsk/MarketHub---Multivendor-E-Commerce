const { pool } = require('../config/db');

// @POST /api/reviews - only buyers who ordered the product
const createReview = async (req, res, next) => {
  try {
    const { product_id, order_id, rating, comment } = req.body;

    // Verify the buyer actually bought this product
    const [items] = await pool.execute(
      `SELECT oi.id FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.product_id = ? AND oi.order_id = ? AND o.buyer_id = ? AND o.status = 'delivered'`,
      [product_id, order_id, req.user.id]
    );

    if (!items.length) {
      return res.status(403).json({
        success: false,
        message: 'You can only review products you have purchased and received.',
      });
    }

    await pool.execute(
      'INSERT INTO reviews (product_id, buyer_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [product_id, req.user.id, order_id, rating, comment || null]
    );

    // Update product rating
    await pool.execute(
      `UPDATE products SET
        rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
       WHERE id = ?`,
      [product_id, product_id, product_id]
    );

    res.status(201).json({ success: true, message: 'Review submitted successfully.' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product.' });
    }
    next(err);
  }
};

// @DELETE /api/reviews/:id - buyer can delete own review
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT product_id FROM reviews WHERE id = ? AND buyer_id = ?',
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const product_id = rows[0].product_id;
    await pool.execute('DELETE FROM reviews WHERE id = ?', [id]);

    // Recalculate rating
    await pool.execute(
      `UPDATE products SET
        rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = ?), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
       WHERE id = ?`,
      [product_id, product_id, product_id]
    );

    res.json({ success: true, message: 'Review deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReview, deleteReview };
