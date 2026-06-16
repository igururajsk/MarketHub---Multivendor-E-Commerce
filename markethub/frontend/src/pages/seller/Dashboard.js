import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '../../api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Package, IndianRupee, ShoppingBag, Star, AlertTriangle, Plus } from 'lucide-react';
import Spinner from '../../components/Spinner';

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerAPI.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ padding: 40, textAlign: 'center' }}>Failed to load dashboard.</p>;

  const { stats, monthly_revenue, top_products, recent_orders, low_stock } = data;

  const statCards = [
    { label: 'Total Revenue', value: `₹${Number(stats.total_revenue).toLocaleString()}`, icon: IndianRupee, color: '#e94560' },
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: '#3b82f6' },
    { label: 'Products', value: stats.total_products, icon: Package, color: '#10b981' },
    { label: 'Avg Rating', value: Number(stats.avg_rating || 0).toFixed(1), icon: Star, color: '#f59e0b' },
  ];

  const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6', shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444' };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Seller Dashboard</h1>
          <Link to="/seller/products/new" style={styles.addBtn}><Plus size={18} /> Add Product</Link>
        </div>

        {/* Stat Cards */}
        <div style={styles.statsGrid}>
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={styles.statCard}>
              <div style={{ ...styles.statIcon, background: color + '20' }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <p style={styles.statLabel}>{label}</p>
                <p style={styles.statValue}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Revenue (Last 6 Months)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthly_revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [`₹${Number(v).toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#e94560" strokeWidth={2.5} dot={{ fill: '#e94560' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={styles.twoCol}>
          {/* Recent Orders */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <h2 style={styles.cardTitle}>Recent Orders</h2>
              <Link to="/seller/orders" style={styles.viewAll}>View All</Link>
            </div>
            {recent_orders.length === 0 ? <p style={styles.empty}>No orders yet.</p> : (
              <div style={styles.list}>
                {recent_orders.map(o => (
                  <div key={o.id} style={styles.listItem}>
                    <div>
                      <p style={styles.itemMain}>#{o.id} — {o.buyer_name}</p>
                      <p style={styles.itemSub}>₹{Number(o.subtotal).toLocaleString()}</p>
                    </div>
                    <span style={{ ...styles.badge, background: STATUS_COLORS[o.status] + '20', color: STATUS_COLORS[o.status] }}>
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Low Stock Alerts */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>⚠️ Low Stock Alerts</h2>
            {low_stock.length === 0 ? <p style={styles.empty}>All products well stocked!</p> : (
              <div style={styles.list}>
                {low_stock.map(p => (
                  <div key={p.id} style={styles.listItem}>
                    <p style={styles.itemMain}>{p.title}</p>
                    <span style={{ ...styles.badge, background: p.stock === 0 ? '#fee2e2' : '#fff7ed', color: p.stock === 0 ? '#ef4444' : '#f59e0b' }}>
                      {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Top Products</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Product', 'Price', 'Units Sold', 'Revenue'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top_products.map(p => (
                  <tr key={p.id}>
                    <td style={styles.td}>{p.title}</td>
                    <td style={styles.td}>₹{Number(p.price).toLocaleString()}</td>
                    <td style={styles.td}>{p.units_sold}</td>
                    <td style={styles.td}>₹{Number(p.revenue).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1200, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  addBtn: { background: '#e94560', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' },
  statCard: { background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#888', fontSize: '0.8rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
  viewAll: { color: '#e94560', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f5f5f5' },
  itemMain: { fontWeight: 600, margin: 0, fontSize: '0.9rem' },
  itemSub: { color: '#888', margin: '2px 0 0', fontSize: '0.8rem' },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600 },
  empty: { color: '#999', textAlign: 'center', padding: '1rem' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.8rem', color: '#888', borderBottom: '2px solid #f5f5f5', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #f5f5f5' },
};
