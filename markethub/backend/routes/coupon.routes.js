const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth.middleware');

// Validate a coupon code
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, order_total } = req.body;
    const [coupons] = await pool.execute(
      'SELECT * FROM coupons WHERE code = ? AND is_active = TRUE AND expires_at > NOW() AND used_count < usage_limit',
      [code.toUpperCase()]
    );
    if (!coupons.length) return res.status(400).json({ success: false, message: 'Invalid or expired coupon.' });
    const c = coupons[0];
    if (order_total < c.min_order_amount) {
      return res.status(400).json({ success: false, message: `Minimum order ₹${c.min_order_amount} required.` });
    }
    const discount = c.discount_type === 'percent'
      ? Math.min((order_total * c.discount_value) / 100, c.max_discount || Infinity)
      : c.discount_value;
    res.json({ success: true, data: { code: c.code, discount_type: c.discount_type, discount_value: c.discount_value, discount_amount: discount } });
  } catch (err) { next(err); }
});

cat > /home/claude/markethub/backend/routes/user.routes.js << 'EOF'
const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { protect } = require('../middleware/auth.middleware');
const bcrypt = require('bcryptjs');

// Update profile
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    await pool.execute('UPDATE users SET name = ?, phone = ? WHERE id = ?', [name, phone || null, req.user.id]);
    res.json({ success: true, message: 'Profile updated.' });
  } catch (err) { next(err); }
});

// Change password
router.put('/password', protect, async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.execute('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isMatch = await bcrypt.compare(current_password, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password incorrect.' });
    const hashed = await bcrypt.hash(new_password, 12);
    await pool.execute('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (err) { next(err); }
});

module.exports = router;
