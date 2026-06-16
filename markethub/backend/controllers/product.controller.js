const { pool } = require('../config/db');

// @GET /api/products - public, with search/filter/pagination
const getProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = '',
      category,
      min_price,
      max_price,
      sort = 'created_at',
      order = 'DESC',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const safeLimit = Math.min(parseInt(limit), 50);

    // Whitelist sort columns to prevent SQL injection
    const allowedSorts = ['price', 'rating', 'created_at', 'review_count'];
    const safeSort = allowedSorts.includes(sort) ? sort : 'created_at';
    const safeOrder = order === 'ASC' ? 'ASC' : 'DESC';

    let conditions = ['p.is_active = TRUE', 'sp.is_approved = TRUE'];
    let params = [];

    if (search) {
      conditions.push('MATCH(p.title, p.description) AGAINST(? IN BOOLEAN MODE)');
      params.push(`${search}*`);
    }

    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }

    if (min_price) {
      conditions.push('p.price >= ?');
      params.push(parseFloat(min_price));
    }

    if (max_price) {
      conditions.push('p.price <= ?');
      params.push(parseFloat(max_price));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [products] = await pool.execute(
      `SELECT p.id, p.title, p.price, p.discount_percent, p.images, p.rating,
              p.review_count, p.stock, p.created_at,
              c.name as category, c.slug as category_slug,
              u.name as seller_name, sp.shop_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       JOIN seller_profiles sp ON u.id = sp.user_id
       ${where}
       ORDER BY p.${safeSort} ${safeOrder}
       LIMIT ? OFFSET ?`,
      [...params, safeLimit, offset]
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       JOIN seller_profiles sp ON u.id = sp.user_id
       ${where}`,
      params
    );

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: parseInt(page),
        limit: safeLimit,
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/products/:id - public
const getProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      `SELECT p.*, c.name as category, c.slug as category_slug,
              u.name as seller_name, sp.shop_name, sp.shop_description, sp.shop_logo
       FROM products p
       JOIN categories c ON p.category_id = c.id
       JOIN users u ON p.seller_id = u.id
       JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // Get reviews
    const [reviews] = await pool.execute(
      `SELECT r.id, r.rating, r.comment, r.images, r.created_at,
              u.name as buyer_name, u.avatar
       FROM reviews r
       JOIN users u ON r.buyer_id = u.id
       WHERE r.product_id = ?
       ORDER BY r.created_at DESC LIMIT 20`,
      [id]
    );

    res.json({ success: true, data: { ...rows[0], reviews } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/products - seller only
const createProduct = async (req, res, next) => {
  try {
    const { title, description, price, stock, category_id, discount_percent = 0 } = req.body;
    const images = req.uploadedImages || [];

    // Check seller is approved
    const [sp] = await pool.execute(
      'SELECT is_approved FROM seller_profiles WHERE user_id = ?',
      [req.user.id]
    );

    if (!sp.length || !sp[0].is_approved) {
      return res.status(403).json({ success: false, message: 'Your seller account is pending approval.' });
    }

    const [result] = await pool.execute(
      `INSERT INTO products (seller_id, category_id, title, description, price, stock, discount_percent, images)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, category_id, title, description, price, stock, discount_percent, JSON.stringify(images)]
    );

    res.status(201).json({ success: true, message: 'Product created.', data: { id: result.insertId } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/products/:id - seller only (own products)
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, stock, category_id, discount_percent, is_active } = req.body;

    // Verify ownership
    const [rows] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found or not yours.' });
    }

    await pool.execute(
      `UPDATE products SET title=?, description=?, price=?, stock=?, category_id=?, discount_percent=?, is_active=?
       WHERE id = ?`,
      [title, description, price, stock, category_id, discount_percent, is_active ?? true, id]
    );

    res.json({ success: true, message: 'Product updated.' });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/products/:id - seller only (own products)
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND seller_id = ?',
      [id, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Product not found or not yours.' });
    }

    // Soft delete
    await pool.execute('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
    res.json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };
