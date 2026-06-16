const { pool } = require('../config/db');

// ─── Cart ────────────────────────────────────────────────────────────────────

const getCart = async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT c.id, c.quantity, p.id as product_id, p.title, p.price, p.discount_percent,
              p.images, p.stock, u.name as seller_name, sp.shop_name
       FROM cart c
       JOIN products p ON c.product_id = p.id
       JOIN users u ON p.seller_id = u.id
       JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE c.user_id = ? AND p.is_active = TRUE`,
      [req.user.id]
    );

    const total = items.reduce((sum, item) => {
      const price = item.price * (1 - item.discount_percent / 100);
      return sum + price * item.quantity;
    }, 0);

    res.json({ success: true, data: { items, total: total.toFixed(2), item_count: items.length } });
  } catch (err) {
    next(err);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid product or quantity.' });
    }

    // Check product exists and has stock
    const [products] = await pool.execute(
      'SELECT id, stock FROM products WHERE id = ? AND is_active = TRUE',
      [product_id]
    );

    if (!products.length) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    if (quantity > products[0].stock) {
      return res.status(400).json({ success: false, message: `Only ${products[0].stock} items available.` });
    }

    // Upsert cart item
    await pool.execute(
      `INSERT INTO cart (user_id, product_id, quantity)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE quantity = ?`,
      [req.user.id, product_id, quantity, quantity]
    );

    res.json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    next(err);
  }
};

const removeFromCart = async (req, res, next) => {
  try {
    const { product_id } = req.params;
    await pool.execute('DELETE FROM cart WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
    res.json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    next(err);
  }
};

const clearCart = async (req, res, next) => {
  try {
    await pool.execute('DELETE FROM cart WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    next(err);
  }
};

// ─── Wishlist ────────────────────────────────────────────────────────────────

const getWishlist = async (req, res, next) => {
  try {
    const [items] = await pool.execute(
      `SELECT w.id, p.id as product_id, p.title, p.price, p.discount_percent, p.images, p.rating
       FROM wishlists w
       JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? AND p.is_active = TRUE`,
      [req.user.id]
    );
    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
};

const toggleWishlist = async (req, res, next) => {
  try {
    const { product_id } = req.body;

    const [existing] = await pool.execute(
      'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
      [req.user.id, product_id]
    );

    if (existing.length) {
      await pool.execute('DELETE FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]);
      return res.json({ success: true, message: 'Removed from wishlist.', wishlisted: false });
    }

    await pool.execute('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
    res.json({ success: true, message: 'Added to wishlist.', wishlisted: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCart, addToCart, removeFromCart, clearCart, getWishlist, toggleWishlist };
