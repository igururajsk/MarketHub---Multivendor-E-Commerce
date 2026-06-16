const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// Generate tokens
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

// @POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'buyer', shop_name } = req.body;

    // Check if email exists
    const [existing] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    // Hash password (salt rounds = 12 for strong security)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role === 'admin' ? 'buyer' : role] // prevent self-admin
    );

    const userId = result.insertId;

    // If seller, create seller profile
    if (role === 'seller') {
      if (!shop_name) {
        return res.status(400).json({ success: false, message: 'Shop name is required for sellers.' });
      }
      await pool.execute(
        'INSERT INTO seller_profiles (user_id, shop_name) VALUES (?, ?)',
        [userId, shop_name]
      );
    }

    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // Store refresh token hash in DB
    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    await pool.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [hashedRefresh, userId]);

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: { id: userId, name, email, role: role === 'admin' ? 'buyer' : role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Always run bcrypt compare even if user not found (prevent timing attacks)
    const [rows] = await pool.execute(
      'SELECT id, name, email, password, role, is_active FROM users WHERE email = ?',
      [email]
    );

    const dummyHash = '$2a$12$dummyhashfortimingtattackspreventionXXXXXXXXXXXXXXXXXX';
    const user = rows[0];
    const hashToCompare = user ? user.password : dummyHash;

    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account has been deactivated. Contact support.' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    const hashedRefresh = await bcrypt.hash(refreshToken, 8);
    await pool.execute('UPDATE users SET refresh_token = ? WHERE id = ?', [hashedRefresh, user.id]);

    res.json({
      success: true,
      message: 'Login successful.',
      data: { id: user.id, name: user.name, email: user.email, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/refresh
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) return res.status(401).json({ success: false, message: 'Refresh token required.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token.' });
    }

    const [rows] = await pool.execute('SELECT id, refresh_token FROM users WHERE id = ?', [decoded.id]);
    if (!rows.length || !rows[0].refresh_token) {
      return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
    }

    const isValid = await bcrypt.compare(token, rows[0].refresh_token);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token.' });
    }

    const newAccessToken = generateAccessToken(decoded.id);
    res.json({ success: true, accessToken: newAccessToken });
  } catch (err) {
    next(err);
  }
};

// @POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    // Invalidate refresh token
    await pool.execute('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
};

// @GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.role, u.avatar, u.phone, u.created_at,
              sp.shop_name, sp.shop_description, sp.shop_logo, sp.is_approved
       FROM users u
       LEFT JOIN seller_profiles sp ON u.id = sp.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, logout, refreshToken, getMe };
