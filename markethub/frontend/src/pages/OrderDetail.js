import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderAPI } from '../api';
import Spinner from '../components/Spinner';
import { ArrowLeft, MapPin, Package } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
};

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getOne(id)
      .then(({ data }) => setOrder(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!order) return <p style={{ padding: 40, textAlign: 'center' }}>Order not found.</p>;

  const address = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <Link to="/orders" style={styles.back}><ArrowLeft size={18} /> Back to Orders</Link>

        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Order #{order.id}</h1>
            <p style={styles.date}>{new Date(order.created_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ ...styles.badge, background: STATUS_COLORS[order.status] + '20', color: STATUS_COLORS[order.status] }}>
              {order.status}
            </span>
            <p style={styles.payBadge}>{order.payment_status === 'paid' ? '✅ Paid' : '⏳ Payment Pending'}</p>
          </div>
        </div>

        {/* Progress tracker */}
        {order.status !== 'cancelled' && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Order Progress</h2>
            <div style={styles.tracker}>
              {STATUS_STEPS.map((step, i) => (
                <div key={step} style={styles.trackerItem}>
                  <div style={{ ...styles.trackerDot, background: i <= currentStep ? '#e94560' : '#e5e7eb' }}>
                    {i <= currentStep ? '✓' : i + 1}
                  </div>
                  <p style={{ ...styles.trackerLabel, color: i <= currentStep ? '#1a1a2e' : '#aaa' }}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </p>
                  {i < STATUS_STEPS.length - 1 && (
                    <div style={{ ...styles.trackerLine, background: i < currentStep ? '#e94560' : '#e5e7eb' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Items</h2>
          {order.items?.map(item => {
            const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
            return (
              <div key={item.id} style={styles.itemRow}>
                <img src={images?.[0] || 'https://via.placeholder.com/60'} alt={item.title} style={styles.itemImg} />
                <div style={styles.itemInfo}>
                  <p style={styles.itemTitle}>{item.title}</p>
                  <p style={styles.itemMeta}>{item.shop_name} · Qty: {item.quantity}</p>
                </div>
                <p style={styles.itemPrice}>₹{(item.price * item.quantity).toLocaleString()}</p>
              </div>
            );
          })}
        </div>

        <div style={styles.twoCol}>
          {/* Shipping Address */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}><MapPin size={16} /> Shipping Address</h2>
            <p style={styles.addressText}>
              {address?.name}<br />
              {address?.line1}<br />
              {address?.line2 && <>{address.line2}<br /></>}
              {address?.city}, {address?.state} - {address?.pincode}<br />
              📞 {address?.phone}
            </p>
          </div>

          {/* Price Summary */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Price Summary</h2>
            <div style={styles.summary}>
              <div style={styles.summaryRow}>
                <span>Subtotal</span>
                <span>₹{(Number(order.total_amount) + Number(order.discount_amount)).toLocaleString()}</span>
              </div>
              {order.discount_amount > 0 && (
                <div style={{ ...styles.summaryRow, color: '#10b981' }}>
                  <span>Discount</span>
                  <span>-₹{Number(order.discount_amount).toLocaleString()}</span>
                </div>
              )}
              <div style={{ ...styles.summaryRow, ...styles.summaryTotal }}>
                <span>Total</span>
                <span>₹{Number(order.total_amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 800, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  back: { display: 'flex', alignItems: 'center', gap: 6, color: '#888', textDecoration: 'none', fontSize: '0.9rem', width: 'fit-content' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' },
  date: { color: '#888', margin: 0, fontSize: '0.9rem' },
  badge: { padding: '4px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600, textTransform: 'capitalize', display: 'inline-block' },
  payBadge: { margin: '6px 0 0', fontSize: '0.85rem', color: '#555' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem', display: 'flex', alignItems: 'center', gap: 6 },
  tracker: { display: 'flex', alignItems: 'flex-start', position: 'relative' },
  trackerItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' },
  trackerDot: { width: 32, height: 32, borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem', zIndex: 1 },
  trackerLabel: { fontSize: '0.75rem', marginTop: 6, textAlign: 'center', fontWeight: 500 },
  trackerLine: { position: 'absolute', top: 16, left: '60%', width: '80%', height: 2, zIndex: 0 },
  itemRow: { display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: '1px solid #f5f5f5' },
  itemImg: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, background: '#f5f5f5' },
  itemInfo: { flex: 1 },
  itemTitle: { fontWeight: 600, margin: '0 0 4px', fontSize: '0.9rem' },
  itemMeta: { color: '#888', margin: 0, fontSize: '0.82rem' },
  itemPrice: { fontWeight: 700, color: '#1a1a2e', margin: 0 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' },
  addressText: { color: '#555', lineHeight: 1.8, margin: 0, fontSize: '0.9rem' },
  summary: { display: 'flex', flexDirection: 'column', gap: 10 },
  summaryRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#555' },
  summaryTotal: { fontWeight: 800, fontSize: '1.1rem', color: '#1a1a2e', paddingTop: 10, borderTop: '2px solid #f5f5f5', marginTop: 4 },
};
