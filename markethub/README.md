# 🛒 MarketHub — Multi-Vendor E-Commerce Marketplace

A full-stack production-grade marketplace with **Buyer / Seller / Admin** roles, Razorpay payments, and analytics dashboard.

**Stack:** React.js · Node.js · Express.js · MySQL · Razorpay · JWT

---

## ⚡ Quick Setup

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup MySQL Database

```bash
mysql -u root -p < backend/config/schema.sql
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=markethub

JWT_SECRET=your_super_secret_32_char_key_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=another_secret_key_here
JWT_REFRESH_EXPIRES_IN=30d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

FRONTEND_URL=http://localhost:3000
```

Create `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Run the App

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm start
```

App runs at: **http://localhost:3000**
API runs at: **http://localhost:5000**

---

## 🏗️ Project Structure

```
markethub/
├── backend/
│   ├── config/
│   │   ├── db.js              # MySQL connection pool
│   │   └── schema.sql         # Full DB schema + seed data
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── payment.controller.js
│   │   ├── cart.controller.js
│   │   ├── review.controller.js
│   │   ├── seller.controller.js
│   │   └── admin.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verify + role check
│   │   ├── error.middleware.js     # Global error handler
│   │   └── validation.middleware.js # express-validator rules
│   ├── routes/                     # All route files
│   └── server.js                   # Entry point + security config
│
└── frontend/
    └── src/
        ├── api/index.js            # Axios instance + all API calls
        ├── context/
        │   ├── AuthContext.js      # Global user state
        │   └── CartContext.js      # Cart state
        ├── components/
        │   ├── Navbar.js
        │   ├── ProductCard.js
        │   └── Spinner.js
        └── pages/
            ├── Home.js
            ├── Products.js         # Search, filter, pagination
            ├── ProductDetail.js
            ├── Cart.js
            ├── Checkout.js         # Razorpay integration
            ├── Orders.js
            ├── OrderDetail.js      # Order tracker
            ├── Wishlist.js
            ├── Profile.js
            ├── Login.js
            ├── Register.js
            ├── seller/
            │   ├── Dashboard.js    # Revenue charts, analytics
            │   ├── Products.js     # CRUD product management
            │   ├── Orders.js       # Update order status
            │   └── AddProduct.js
            └── admin/
                ├── Dashboard.js    # Platform-wide stats
                ├── Users.js        # Activate/deactivate users
                ├── Sellers.js      # Approve/reject sellers
                └── Coupons.js      # Create discount coupons
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| Password hashing | bcryptjs with 12 salt rounds |
| Auth tokens | JWT access (7d) + refresh tokens (30d) |
| Refresh token rotation | Stored as bcrypt hash in DB |
| Rate limiting | Global: 100/15min · Auth: 10/15min |
| HTTP headers | Helmet.js (XSS, CSP, HSTS, etc.) |
| CORS | Whitelist-only frontend origin |
| Input validation | express-validator on all inputs |
| SQL injection | Parameterized queries everywhere |
| Body size limit | 10kb max payload |
| Role-based access | Middleware guard on every protected route |
| Timing attack prevention | bcrypt runs even for unknown emails |
| Soft deletes | Products deactivated, not hard-deleted |
| Payment verification | Razorpay HMAC signature check |

---

## 👤 Default Test Accounts

After running schema.sql, set admin password by registering and changing role:

```sql
-- In MySQL:
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

---

## 🌐 API Endpoints

### Auth
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/logout | Auth |
| GET | /api/auth/me | Auth |

### Products
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/products | Public |
| GET | /api/products/:id | Public |
| POST | /api/products | Seller |
| PUT | /api/products/:id | Seller (own) |
| DELETE | /api/products/:id | Seller (own) |

### Orders
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/orders | Buyer |
| GET | /api/orders | Auth |
| GET | /api/orders/:id | Auth |
| PATCH | /api/orders/:id/status | Seller/Admin |

### Payment
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/payment/create-order | Auth |
| POST | /api/payment/verify | Auth |

### Seller
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/seller/dashboard | Seller |
| GET | /api/seller/orders | Seller |

### Admin
| Method | Route | Access |
|--------|-------|--------|
| GET | /api/admin/dashboard | Admin |
| GET | /api/admin/users | Admin |
| PATCH | /api/admin/users/:id/toggle | Admin |
| GET | /api/admin/sellers | Admin |
| PATCH | /api/admin/sellers/:id/approve | Admin |
| POST | /api/admin/coupons | Admin |

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Connect GitHub repo to Vercel, set REACT_APP_API_URL env var
```

### Backend → Railway
```bash
# Push to GitHub → connect Railway
# Add all env vars in Railway dashboard
# Railway auto-detects Node.js
```

### Database → Railway MySQL
```bash
# Add MySQL plugin in Railway
# Run schema.sql in the Railway MySQL console
```

---

## 📝 Resume Description

> Built a production-style multi-vendor e-commerce platform with buyer, seller, and admin roles. Features include product search with full-text indexing, cart management, Razorpay payment integration with HMAC signature verification, order lifecycle tracking, seller analytics dashboard with Recharts, and coupon/discount system — secured with JWT refresh tokens, bcrypt hashing, rate limiting, and Helmet.js. **Stack: React.js, Node.js, Express.js, MySQL.**
