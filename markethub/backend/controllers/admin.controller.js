const { pool } = require('../config/db');

// @GET /api/admin/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const [[stats]] = await pool.execute(`
      SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'buyer') as total_buyers,
        (SELECT COUNT(*) FROM users WHERE role = 'seller') as total_sellers,
        (SELECT COUNT(*) FROM products WHERE is_active = TRUE) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE payment_status = 'paid') as total_revenue,
        (SELECT COUNT(*) FROM seller_profiles WHERE is_approved = FALSE) as pending_sellers
    `);

    const [recentOrders] = await pool.execute(
      `SELECT o.id, o.total_amount, o.status, o.payment_status, o.created_at,
              u.name as buyer_name
       FROM orders o JOIN users u ON o.buyer_id = u.id
       ORDER BY o.created_at DESC LIMIT 10`
    );

    res.json({ success: true, data: { stats, recent_orders: recentOrders } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/sellers - list all sellers with approval status
const getSellers = async (req, res, next) => {
  try {
    const { approved } = req.query;
    let where = '';
    const params = [];

    if (approved !== undefined) {
      where = 'WHERE sp.is_approved = ?';
      params.push(approved === 'true' ? 1 : 0);
    }

    const [sellers] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.is_active, u.created_at,
              sp.shop_name, sp.shop_description, sp.is_approved, sp.total_sales
       FROM users u JOIN seller_profiles sp ON u.id = sp.user_id
       ${where} ORDER BY u.created_at DESC`,
      params
    );

    res.json({ success: true, data: sellers });
  } catch (err) {
    next(err);
  }
};

// @PATCH /api/admin/sellers/:id/approve
const approveSeller = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approve } = req.body;

    await pool.execute(
      'UPDATE seller_profiles SET is_approved = ? WHERE user_id = ?',
      [approve ? 1 : 0, id]
    );

    res.json({ success: true, message: `Seller ${approve ? 'approved' : 'rejected'}.` });
  } catch (err) {
    next(err);
  }
};

// @PATCH /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself.' });
    }
    await pool.execute('UPDATE users SET is_active = NOT is_active WHERE id = ?', [id]);
    res.json({ success: true, message: 'User status toggled.' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const { page = 1, role } = req.query;
    const limit = 20;
    const offset = (parseInt(page) - 1) * limit;
    let where = '';
    const params = [];

    if (role) {
      where = 'WHERE role = ?';
      params.push(role);
    }

    const [users] = await pool.execute(
      `SELECT id, name, email, role, is_active, created_at FROM users ${where}
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
};

// @POST /api/admin/coupons
const createCoupon = async (req, res, next) => {
  try {
    const { code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at } = req.body;

    await pool.execute(
      `INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_discount, usage_limit, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code.toUpperCase(), discount_type, discount_value, min_order_amount || 0, max_discount || null, usage_limit || 1, expires_at]
    );

    res.status(201).json({ success: true, message: 'Coupon created.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getSellers, approveSeller, toggleUserStatus, getUsers, createCoupon };
