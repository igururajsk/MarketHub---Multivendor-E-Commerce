import { useCart } from '../context/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import Spinner from '../components/Spinner';

export default function Cart() {
  const { cart, cartLoading, removeFromCart, addToCart } = useCart();
  const navigate = useNavigate();

  if (cartLoading) return <Spinner />;

  if (!cart.items.length) return (
    <div style={styles.empty}>
      <ShoppingBag size={64} color="#ddd" />
      <h2 style={styles.emptyTitle}>Your cart is empty</h2>
      <p style={styles.emptySub}>Add items to your cart to get started</p>
      <Link to="/products" style={styles.shopBtn}>Continue Shopping</Link>
    </div>
  );

  const images = (item) => {
    const imgs = typeof item.images === 'string' ? JSON.parse(item.images || '[]') : (item.images || []);
    return imgs[0] || 'https://via.placeholder.com/80?text=?';
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Shopping Cart <span style={styles.count}>({cart.item_count} items)</span></h1>

        <div style={styles.layout}>
          {/* Items */}
          <div style={styles.items}>
            {cart.items.map(item => {
              const discounted = item.price * (1 - (item.discount_percent || 0) / 100);
              return (
                <div key={item.product_id} style={styles.item}>
                  <img src={images(item)} alt={item.title} style={styles.itemImg} />
                  <div style={styles.itemInfo}>
                    <Link to={`/products/${item.product_id}`} style={styles.itemTitle}>{item.title}</Link>
                    <p style={styles.itemShop}>{item.shop_name}</p>
                    <div style={styles.itemBottom}>
                      <div style={styles.qtyControl}>
                        <button onClick={() => addToCart(item.product_id, Math.max(1, item.quantity - 1))} style={styles.qtyBtn}>−</button>
                        <span style={styles.qtyVal}>{item.quantity}</span>
                        <button onClick={() => addToCart(item.product_id, Math.min(item.stock, item.quantity + 1))} style={styles.qtyBtn}>+</button>
                      </div>
                      <div style={styles.priceCol}>
                        <span style={styles.itemPrice}>₹{(discounted * item.quantity).toFixed(0)}</span>
                        {item.discount_percent > 0 && (
                          <span style={styles.itemOriginal}>₹{(item.price * item.quantity).toFixed(0)}</span>
                        )}
                      </div>
                      <button onClick={() => removeFromCart(item.product_id)} style={styles.removeBtn}>
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div style={styles.summary}>
            <h2 style={styles.summaryTitle}>Order Summary</h2>
            <div style={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₹{Number(cart.total).toFixed(0)}</span>
            </div>
            <div style={styles.summaryRow}>
              <span>Shipping</span>
              <span style={{ color: '#10b981' }}>FREE</span>
            </div>
            <div style={styles.divider} />
            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.1rem' }}>
              <span>Total</span>
              <span>₹{Number(cart.total).toFixed(0)}</span>
            </div>
            <button onClick={() => navigate('/checkout')} style={styles.checkoutBtn}>
              Proceed to Checkout <ArrowRight size={18} />
            </button>
            <Link to="/products" style={styles.continueLink}>← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1.5rem' },
  count: { fontSize: '1rem', color: '#888', fontWeight: 400 },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem', alignItems: 'start' },
  items: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  item: { background: '#fff', borderRadius: 12, padding: '1rem', display: 'flex', gap: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  itemImg: { width: 90, height: 90, objectFit: 'cover', borderRadius: 8, flexShrink: 0 },
  itemInfo: { flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  itemTitle: { fontWeight: 700, color: '#1a1a2e', textDecoration: 'none', fontSize: '0.95rem', lineHeight: 1.3 },
  itemShop: { color: '#888', fontSize: '0.8rem', margin: 0 },
  itemBottom: { display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto' },
  qtyControl: { display: 'flex', alignItems: 'center', border: '2px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { width: 32, height: 32, border: 'none', background: '#f5f5f5', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' },
  qtyVal: { width: 40, textAlign: 'center', fontWeight: 700, fontSize: '0.95rem' },
  priceCol: { display: 'flex', alignItems: 'center', gap: 6 },
  itemPrice: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e' },
  itemOriginal: { fontSize: '0.85rem', color: '#bbb', textDecoration: 'line-through' },
  removeBtn: { marginLeft: 'auto', background: '#fee2e2', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  summary: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 80 },
  summaryTitle: { fontWeight: 700, fontSize: '1.1rem', margin: '0 0 1.25rem', color: '#1a1a2e' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', color: '#555', marginBottom: '0.75rem', fontSize: '0.95rem' },
  divider: { borderTop: '2px solid #f5f5f5', margin: '0.75rem 0' },
  checkoutBtn: { width: '100%', background: '#e94560', color: '#fff', border: 'none', padding: '0.9rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '1rem' },
  continueLink: { display: 'block', textAlign: 'center', marginTop: '1rem', color: '#888', textDecoration: 'none', fontSize: '0.85rem' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: '1rem', textAlign: 'center', padding: '2rem' },
  emptyTitle: { fontSize: '1.5rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  emptySub: { color: '#888', margin: 0 },
  shopBtn: { background: '#e94560', color: '#fff', padding: '0.8rem 2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700 },
};
