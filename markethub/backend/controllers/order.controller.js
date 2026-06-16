const { pool } = require('../config/db');

// @POST /api/orders - buyer creates order
const createOrder = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const { shipping_address, coupon_code, notes } = req.body;
    const buyer_id = req.user.id;

    // Get cart items
    const [cartItems] = await conn.execute(
      `SELECT c.product_id, c.quantity, p.price, p.discount_percent, p.stock, p.seller_id, p.title
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ? AND p.is_active = TRUE`,
      [buyer_id]
    );

    if (!cartItems.length) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    // Check stock for each item
    for (const item of cartItems) {
      if (item.quantity > item.stock) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.title}". Available: ${item.stock}`,
        });
      }
    }

    // Calculate total
    let total = cartItems.reduce((sum, item) => {
      const discounted = item.price * (1 - item.discount_percent / 100);
      return sum + discounted * item.quantity;
    }, 0);

    let discount_amount = 0;

    // Apply coupon if provided
    if (coupon_code) {
      const [coupons] = await conn.execute(
        `SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND expires_at > NOW() AND used_count < usage_limit`,
        [coupon_code.toUpperCase()]
      );

      if (!coupons.length) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
      }

      const coupon = coupons[0];
      if (total < coupon.min_order_amount) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Minimum order amount for this coupon is ₹${coupon.min_order_amount}`,
        });
      }

      discount_amount = coupon.discount_type === 'percent'
        ? Math.min((total * coupon.discount_value) / 100, coupon.max_discount || Infinity)
        : coupon.discount_value;

      await conn.execute('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [coupon.id]);
    }

    const final_total = Math.max(total - discount_amount, 0);

    // Create order
    const [orderResult] = await conn.execute(
      `INSERT INTO orders (buyer_id, total_amount, discount_amount, shipping_address, coupon_code, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [buyer_id, final_total, discount_amount, JSON.stringify(shipping_address), coupon_code || null, notes || null]
    );

    const order_id = orderResult.insertId;

    // Create order items and reduce stock
    for (const item of cartItems) {
      const discounted = item.price * (1 - item.discount_percent / 100);
      await conn.execute(
        `INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)`,
        [order_id, item.product_id, item.seller_id, item.quantity, discounted]
      );
      await conn.execute(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Clear cart
    await conn.execute('DELETE FROM cart WHERE user_id = ?', [buyer_id]);

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      data: { order_id, total: final_total, discount_amount },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// @GET /api/orders - buyer's own orders
const getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [orders] = await pool.execute(
      `SELECT o.id, o.total_amount, o.discount_amount, o.status, o.payment_status,
              o.shipping_address, o.created_at,
              COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.buyer_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

// @GET /api/orders/:id - order detail
const getOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [orders] = await pool.execute(
      `SELECT o.*, u.name as buyer_name, u.email as buyer_email
       FROM orders o JOIN users u ON o.buyer_id = u.id
       WHERE o.id = ? AND (o.buyer_id = ? OR ? = 'admin')`,
      [id, req.user.id, req.user.role]
    );

    if (!orders.length) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    const [items] = await pool.execute(
      `SELECT oi.*, p.title, p.images, sp.shop_name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       JOIN seller_profiles sp ON oi.seller_id = sp.user_id
       WHERE oi.order_id = ?`,
      [id]
    );

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (err) {
    next(err);
  }
};

// @PATCH /api/orders/:id/status - seller/admin
const updateOrderItemStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, item_id } = req.body;

    const allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    // Seller can only update their own items
    if (req.user.role === 'seller') {
      await pool.execute(
        'UPDATE order_items SET status = ? WHERE id = ? AND order_id = ? AND seller_id = ?',
        [status, item_id, id, req.user.id]
      );
    } else {
      await pool.execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    }

    res.json({ success: true, message: 'Status updated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { createOrder, getMyOrders, getOrder, updateOrderItemStatus };
