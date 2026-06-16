import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI } from '../api';
import Spinner from '../components/Spinner';
import { Package, ChevronRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: { bg: '#fff7ed', color: '#f59e0b' },
  confirmed: { bg: '#eff6ff', color: '#3b82f6' },
  processing: { bg: '#f5f3ff', color: '#8b5cf6' },
  shipped: { bg: '#ecfeff', color: '#06b6d4' },
  delivered: { bg: '#f0fdf4', color: '#10b981' },
  cancelled: { bg: '#fef2f2', color: '#ef4444' },
  refunded: { bg: '#fdf4ff', color: '#a855f7' },
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getAll()
      .then(({ data }) => setOrders(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}>My Orders</h1>
        {orders.length === 0 ? (
          <div style={styles.empty}>
            <Package size={56} color="#ccc" />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders.</p>
            <Link to="/products" style={styles.shopBtn}>Start Shopping</Link>
          </div>
        ) : (
          <div style={styles.list}>
            {orders.map(order => {
              const s = STATUS_COLORS[order.status] || STATUS_COLORS.pending;
              return (
                <Link to={`/orders/${order.id}`} key={order.id} style={styles.card}>
                  <div style={styles.cardLeft}>
                    <p style={styles.orderId}>Order #{order.id}</p>
                    <p style={styles.orderMeta}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      &nbsp;·&nbsp;{order.item_count} item{order.item_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={styles.cardRight}>
                    <p style={styles.amount}>₹{Number(order.total_amount).toLocaleString()}</p>
                    <span style={{ ...styles.badge, background: s.bg, color: s.color }}>{order.status}</span>
                    <ChevronRight size={18} color="#ccc" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 700, margin: '0 auto' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', color: 'inherit', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardLeft: {},
  cardRight: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  orderId: { fontWeight: 700, fontSize: '1rem', margin: '0 0 4px', color: '#1a1a2e' },
  orderMeta: { color: '#888', fontSize: '0.85rem', margin: 0 },
  amount: { fontWeight: 700, color: '#1a1a2e', margin: 0 },
  badge: { padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' },
  empty: { textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888' },
  shopBtn: { background: '#e94560', color: '#fff', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, marginTop: '0.5rem' },
};
