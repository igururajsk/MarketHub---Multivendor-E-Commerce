import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api';
import Spinner from '../../components/Spinner';
import { Users, ShoppingBag, Package, IndianRupee, Clock, ShieldCheck } from 'lucide-react';

const STATUS_COLORS = {
  pending: '#f59e0b', confirmed: '#3b82f6', processing: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(({ data }) => setData(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (!data) return <p style={{ padding: 40, textAlign: 'center' }}>Failed to load.</p>;

  const { stats, recent_orders } = data;

  const statCards = [
    { label: 'Total Buyers', value: stats.total_buyers, icon: Users, color: '#3b82f6', link: '/admin/users?role=buyer' },
    { label: 'Total Sellers', value: stats.total_sellers, icon: ShoppingBag, color: '#8b5cf6', link: '/admin/sellers' },
    { label: 'Products', value: stats.total_products, icon: Package, color: '#10b981', link: null },
    { label: 'Total Orders', value: stats.total_orders, icon: ShoppingBag, color: '#f59e0b', link: null },
    { label: 'Revenue', value: `₹${Number(stats.total_revenue).toLocaleString()}`, icon: IndianRupee, color: '#e94560', link: null },
    { label: 'Pending Sellers', value: stats.pending_sellers, icon: Clock, color: '#f97316', link: '/admin/sellers?approved=false' },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <div style={styles.navLinks}>
            <Link to="/admin/users" style={styles.navLink}>Users</Link>
            <Link to="/admin/sellers" style={styles.navLink}>Sellers</Link>
            <Link to="/admin/coupons" style={styles.navLink}>Coupons</Link>
          </div>
        </div>

        {stats.pending_sellers > 0 && (
          <div style={styles.alert}>
            <ShieldCheck size={18} />
            <span><strong>{stats.pending_sellers}</strong> seller(s) waiting for approval.</span>
            <Link to="/admin/sellers?approved=false" style={styles.alertLink}>Review Now →</Link>
          </div>
        )}

        <div style={styles.statsGrid}>
          {statCards.map(({ label, value, icon: Icon, color, link }) => {
            const card = (
              <div style={styles.statCard}>
                <div style={{ ...styles.statIcon, background: color + '20' }}>
                  <Icon size={22} color={color} />
                </div>
                <div>
                  <p style={styles.statLabel}>{label}</p>
                  <p style={styles.statValue}>{value}</p>
                </div>
              </div>
            );
            return link ? <Link key={label} to={link} style={{ textDecoration: 'none' }}>{card}</Link> : <div key={label}>{card}</div>;
          })}
        </div>

        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Recent Orders</h2>
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>{['Order ID', 'Buyer', 'Amount', 'Status', 'Date'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {recent_orders.map(o => {
                  const sc = STATUS_COLORS[o.status] || '#888';
                  return (
                    <tr key={o.id}>
                      <td style={styles.td}>#{o.id}</td>
                      <td style={styles.td}>{o.buyer_name}</td>
                      <td style={styles.td}>₹{Number(o.total_amount).toLocaleString()}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.badge, background: sc + '20', color: sc }}>{o.status}</span>
                      </td>
                      <td style={styles.td}>{new Date(o.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  );
                })}
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
  container: { maxWidth: 1100, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  navLinks: { display: 'flex', gap: '0.5rem' },
  navLink: { background: '#1a1a2e', color: '#fff', textDecoration: 'none', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.88rem', fontWeight: 600 },
  alert: { background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#c2410c', fontSize: '0.9rem' },
  alertLink: { color: '#e94560', fontWeight: 700, marginLeft: 'auto', textDecoration: 'none' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' },
  statCard: { background: '#fff', borderRadius: 12, padding: '1.25rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' },
  statIcon: { width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: '#888', fontSize: '0.78rem', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#888', borderBottom: '2px solid #f5f5f5', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '0.85rem 0.75rem', fontSize: '0.9rem', borderBottom: '1px solid #f9f9f9' },
  badge: { padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' },
};
