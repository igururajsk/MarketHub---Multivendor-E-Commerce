import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, User, LogOut, Package, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart() || { cart: { item_count: 0 } };
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
    navigate('/login');
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          🛒 MarketHub
        </Link>

        <div style={styles.links}>
          <Link to="/products" style={styles.link}>Shop</Link>

          {user ? (
            <>
              <Link to="/cart" style={styles.iconBtn}>
                <ShoppingCart size={20} />
                {cart?.item_count > 0 && <span style={styles.badge}>{cart.item_count}</span>}
              </Link>
              <Link to="/wishlist" style={styles.iconBtn}><Heart size={20} /></Link>
              <Link to="/orders" style={styles.iconBtn}><Package size={20} /></Link>

              {user.role === 'seller' && (
                <Link to="/seller/dashboard" style={styles.iconBtn}><LayoutDashboard size={20} /></Link>
              )}
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" style={styles.iconBtn}><Shield size={20} /></Link>
              )}

              <Link to="/profile" style={styles.iconBtn}><User size={20} /></Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                <LogOut size={18} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={styles.link}>Login</Link>
              <Link to="/register" style={styles.registerBtn}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: { background: '#1a1a2e', padding: '0 1rem', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 10px rgba(0,0,0,0.3)' },
  container: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { color: '#e94560', fontWeight: 800, fontSize: '1.4rem', textDecoration: 'none', letterSpacing: '-0.5px' },
  links: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  link: { color: '#ccc', textDecoration: 'none', fontSize: '0.9rem', ':hover': { color: '#fff' } },
  iconBtn: { color: '#ccc', textDecoration: 'none', position: 'relative', display: 'flex', alignItems: 'center', padding: '0.4rem' },
  badge: { position: 'absolute', top: -4, right: -4, background: '#e94560', color: '#fff', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 },
  logoutBtn: { background: 'transparent', border: '1px solid #e94560', color: '#e94560', cursor: 'pointer', borderRadius: 6, padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' },
  registerBtn: { background: '#e94560', color: '#fff', padding: '0.4rem 1rem', borderRadius: 6, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 },
};
