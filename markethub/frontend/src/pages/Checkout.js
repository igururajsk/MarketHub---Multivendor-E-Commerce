import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, paymentAPI, couponAPI } from '../api';
import { CheckCircle, Tag } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_ADDR = { name: '', phone: '', address: '', city: '', state: '', pincode: '' };

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [addr, setAddr] = useState(INITIAL_ADDR);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);

  const setField = (key) => (e) => setAddr(a => ({ ...a, [key]: e.target.value }));
  const total = Number(cart.total);
  const finalTotal = Math.max(total - discount, 0);

  const validateCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponAPI.validate({ code: coupon, order_total: total });
      setDiscount(data.data.discount_amount);
      setCouponData(data.data);
      toast.success(`Coupon applied! ₹${data.data.discount_amount.toFixed(0)} saved`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setDiscount(0);
      setCouponData(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    const required = ['name', 'phone', 'address', 'city', 'state', 'pincode'];
    for (const f of required) {
      if (!addr[f].trim()) return toast.error(`Please fill in ${f}`);
    }
    if (!/^\d{10}$/.test(addr.phone)) return toast.error('Enter a valid 10-digit phone number');
    if (!/^\d{6}$/.test(addr.pincode)) return toast.error('Enter a valid 6-digit pincode');

    setLoading(true);
    try {
      // Create order in DB
      const { data: orderData } = await orderAPI.create({
        shipping_address: addr,
        coupon_code: couponData?.code || null,
      });

      const order_id = orderData.data.order_id;

      // Create Razorpay payment order
      const { data: payData } = await paymentAPI.createOrder(order_id);

      // Launch Razorpay checkout
      const options = {
        key: payData.data.key_id,
        amount: payData.data.amount,
        currency: payData.data.currency,
        name: 'MarketHub',
        description: `Order #${order_id}`,
        order_id: payData.data.razorpay_order_id,
        prefill: { name: user.name, email: user.email, contact: addr.phone },
        theme: { color: '#e94560' },
        handler: async (response) => {
          try {
            await paymentAPI.verify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_id,
            });
            await clearCart();
            toast.success('Payment successful! Order confirmed.');
            navigate(`/orders/${order_id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        modal: {
          ondismiss: () => toast('Payment cancelled. Your order is saved.'),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>Checkout</h1>

        <div style={styles.layout}>
          {/* Left — Address */}
          <div style={styles.left}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Shipping Address</h2>
              <div style={styles.formGrid}>
                {[
                  { key: 'name', label: 'Full Name', placeholder: 'John Doe' },
                  { key: 'phone', label: 'Phone', placeholder: '10-digit mobile number' },
                  { key: 'address', label: 'Address', placeholder: 'Street, Area, Landmark' },
                  { key: 'city', label: 'City', placeholder: 'Mumbai' },
                  { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                  { key: 'pincode', label: 'Pincode', placeholder: '400001' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} style={key === 'address' ? { ...styles.field, gridColumn: '1 / -1' } : styles.field}>
                    <label style={styles.label}>{label}</label>
                    <input value={addr[key]} onChange={setField(key)} placeholder={placeholder} style={styles.input} />
                  </div>
                ))}
              </div>
            </div>

            {/* Coupon */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}><Tag size={16} /> Apply Coupon</h2>
              <div style={styles.couponRow}>
                <input
                  value={coupon}
                  onChange={e => setCoupon(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  style={{ ...styles.input, flex: 1 }}
                />
                <button onClick={validateCoupon} disabled={couponLoading} style={styles.applyBtn}>
                  {couponLoading ? '...' : 'Apply'}
                </button>
              </div>
              {couponData && (
                <p style={styles.couponSuccess}>
                  <CheckCircle size={14} /> Coupon <strong>{couponData.code}</strong> applied — ₹{discount.toFixed(0)} off!
                </p>
              )}
            </div>
          </div>

          {/* Right — Summary */}
          <div style={styles.summary}>
            <h2 style={styles.cardTitle}>Order Summary</h2>
            <div style={styles.summaryItems}>
              {cart.items.map(item => {
                const discounted = item.price * (1 - (item.discount_percent || 0) / 100);
                return (
                  <div key={item.product_id} style={styles.summaryItem}>
                    <span style={styles.summaryItemName}>{item.title} × {item.quantity}</span>
                    <span>₹{(discounted * item.quantity).toFixed(0)}</span>
                  </div>
                );
              })}
            </div>
            <div style={styles.divider} />
            <div style={styles.summaryRow}><span>Subtotal</span><span>₹{total.toFixed(0)}</span></div>
            {discount > 0 && <div style={{ ...styles.summaryRow, color: '#10b981' }}><span>Coupon Discount</span><span>−₹{discount.toFixed(0)}</span></div>}
            <div style={styles.summaryRow}><span>Shipping</span><span style={{ color: '#10b981' }}>FREE</span></div>
            <div style={styles.divider} />
            <div style={{ ...styles.summaryRow, fontWeight: 700, fontSize: '1.15rem' }}>
              <span>Total</span><span>₹{finalTotal.toFixed(0)}</span>
            </div>
            <button onClick={handlePlaceOrder} disabled={loading || !cart.items.length} style={styles.orderBtn}>
              {loading ? 'Processing...' : `Pay ₹${finalTotal.toFixed(0)} via Razorpay`}
            </button>
            <p style={styles.secure}>🔒 Secured by Razorpay</p>
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
  layout: { display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' },
  left: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontWeight: 700, fontSize: '1rem', color: '#1a1a2e', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 8 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  label: { fontWeight: 600, fontSize: '0.85rem', color: '#444' },
  input: { padding: '0.7rem 0.9rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none' },
  couponRow: { display: 'flex', gap: 8 },
  applyBtn: { background: '#1a1a2e', color: '#fff', border: 'none', padding: '0 1.25rem', borderRadius: 8, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  couponSuccess: { color: '#10b981', fontSize: '0.85rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 },
  summary: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'sticky', top: 80 },
  summaryItems: { display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' },
  summaryItem: { display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555' },
  summaryItemName: { flex: 1, marginRight: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  divider: { borderTop: '2px solid #f5f5f5', margin: '0.75rem 0' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', color: '#555', marginBottom: '0.6rem', fontSize: '0.95rem' },
  orderBtn: { width: '100%', background: '#e94560', color: '#fff', border: 'none', padding: '1rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '1rem', marginTop: '1rem' },
  secure: { textAlign: 'center', color: '#888', fontSize: '0.8rem', marginTop: '0.75rem' },
};
