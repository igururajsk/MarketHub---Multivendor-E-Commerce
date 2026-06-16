const { pool } = require('../config/db');

// @GET /api/seller/dashboard
const getDashboard = async (req, res, next) => {
  try {
    const seller_id = req.user.id;

    // Total revenue, orders, products
    const [[stats]] = await pool.execute(
      `SELECT
        COUNT(DISTINCT oi.order_id) as total_orders,
        COALESCE(SUM(oi.price * oi.quantity), 0) as total_revenue,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(AVG(p.rating), 0) as avg_rating
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       WHERE p.seller_id = ? AND p.is_active = TRUE`,
      [seller_id]
    );

    // Monthly revenue (last 6 months)
    const [monthly] = await pool.execute(
      `SELECT DATE_FORMAT(o.created_at, '%Y-%m') as month,
              COALESCE(SUM(oi.price * oi.quantity), 0) as revenue,
              COUNT(DISTINCT oi.order_id) as orders
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       WHERE oi.seller_id = ? AND o.payment_status = 'paid'
         AND o.created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [seller_id]
    );

    // Top products
    const [topProducts] = await pool.execute(
      `SELECT p.id, p.title, p.price, p.images,
              COALESCE(SUM(oi.quantity), 0) as units_sold,
              COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       WHERE p.seller_id = ?
       GROUP BY p.id
       ORDER BY revenue DESC
       LIMIT 5`,
      [seller_id]
    );

    // Recent orders
    const [recentOrders] = await pool.execute(
      `SELECT o.id, o.created_at, o.status, o.payment_status,
              u.name as buyer_name,
              SUM(oi.price * oi.quantity) as subtotal
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN users u ON o.buyer_id = u.id
       WHERE oi.seller_id = ?
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [seller_id]
    );

    // Low stock alerts
    const [lowStock] = await pool.execute(
      'SELECT id, title, stock FROM products WHERE seller_id = ? AND stock < 10 AND is_active = TRUE ORDER BY stock ASC',
      [seller_id]
    );

    res.json({
      success: true,
      data: { stats, monthly_revenue: monthly, top_products: topProducts, recent_orders: recentOrders, low_stock: lowStock },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/seller/orders
const getSellerOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE oi.seller_id = ?';
    const params = [req.user.id];

    if (status) {
      where += ' AND oi.status = ?';
      params.push(status);
    }

    const [orders] = await pool.execute(
      `SELECT oi.id as item_id, oi.status as item_status, oi.quantity, oi.price,
              o.id as order_id, o.created_at, o.payment_status,
              p.title, p.images,
              u.name as buyer_name, u.email as buyer_email
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       JOIN products p ON oi.product_id = p.id
       JOIN users u ON o.buyer_id = u.id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard, getSellerOrders };
