import { useState, useEffect } from 'react';
import { sellerAPI, orderAPI } from '../../api';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['processing', 'shipped', 'delivered', 'cancelled'];
const STATUS_COLORS = {
  pending: '#f59e0b', processing: '#8b5cf6', shipped: '#06b6d4',
  delivered: '#10b981', cancelled: '#ef4444',
};

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const fetchOrders = () => {
    sellerAPI.getOrders(filter ? { status: filter } : {})
      .then(({ data }) => setOrders(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, [filter]);

  const updateStatus = async (orderId, itemId, status) => {
    try {
      await orderAPI.updateStatus(orderId, { status, item_id: itemId });
      toast.success('Status updated');
      fetchOrders();
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Manage Orders</h1>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
            <option value="">All Orders</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
        </div>

        {orders.length === 0 ? (
          <div style={styles.empty}><p>No orders found.</p></div>
        ) : (
          <div style={styles.list}>
            {orders.map(order => {
              const images = typeof order.images === 'string' ? JSON.parse(order.images) : order.images;
              const statusColor = STATUS_COLORS[order.item_status] || '#888';
              return (
                <div key={order.item_id} style={styles.card}>
                  <img src={images?.[0] || 'https://via.placeholder.com/60'} alt={order.title} style={styles.img} />
                  <div style={styles.info}>
                    <p style={styles.productName}>{order.title}</p>
                    <p style={styles.meta}>Order #{order.order_id} · {order.buyer_name} · Qty: {order.quantity}</p>
                    <p style={styles.meta}>₹{(order.price * order.quantity).toLocaleString()} · {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                    <p style={styles.meta}>{order.payment_status === 'paid' ? '✅ Paid' : '⏳ Awaiting payment'}</p>
                  </div>
                  <div style={styles.statusBox}>
                    <span style={{ ...styles.badge, background: statusColor + '20', color: statusColor }}>
                      {order.item_status}
                    </span>
                    <select
                      value=""
                      onChange={e => e.target.value && updateStatus(order.order_id, order.item_id, e.target.value)}
                      style={styles.statusSelect}
                    >
                      <option value="">Update status</option>
                      {STATUS_OPTIONS.filter(s => s !== order.item_status).map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
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
  container: { maxWidth: 900, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  select: { padding: '0.6rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  img: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8 },
  info: { flex: 1 },
  productName: { fontWeight: 700, margin: '0 0 4px', fontSize: '0.95rem' },
  meta: { color: '#888', margin: '2px 0', fontSize: '0.82rem' },
  statusBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 },
  badge: { padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' },
  statusSelect: { padding: '0.4rem 0.75rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer', background: '#fff' },
  empty: { background: '#fff', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
};
