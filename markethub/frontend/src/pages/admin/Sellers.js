import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminAPI } from '../../api';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle } from 'lucide-react';

export default function AdminSellers() {
  const [searchParams] = useSearchParams();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(searchParams.get('approved') ?? '');

  const fetchSellers = () => {
    const params = filter !== '' ? { approved: filter } : {};
    adminAPI.getSellers(params)
      .then(({ data }) => setSellers(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSellers(); }, [filter]);

  const approve = async (id, value) => {
    try {
      await adminAPI.approveSeller(id, value);
      setSellers(prev => prev.map(s => s.id === id ? { ...s, is_approved: value } : s));
      toast.success(value ? 'Seller approved!' : 'Seller rejected');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Manage Sellers ({sellers.length})</h1>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={styles.select}>
            <option value="">All Sellers</option>
            <option value="false">Pending Approval</option>
            <option value="true">Approved</option>
          </select>
        </div>

        {sellers.length === 0 ? (
          <div style={styles.empty}><p>No sellers found.</p></div>
        ) : (
          <div style={styles.grid}>
            {sellers.map(s => (
              <div key={s.id} style={styles.card}>
                <div style={styles.cardTop}>
                  <div style={styles.shopAvatar}>{s.shop_name[0].toUpperCase()}</div>
                  <div>
                    <p style={styles.shopName}>{s.shop_name}</p>
                    <p style={styles.ownerName}>{s.name} · {s.email}</p>
                  </div>
                  <span style={{ ...styles.badge, ...(s.is_approved ? styles.approved : styles.pending) }}>
                    {s.is_approved ? '✓ Approved' : '⏳ Pending'}
                  </span>
                </div>
                {s.shop_description && <p style={styles.desc}>{s.shop_description}</p>}
                <div style={styles.meta}>
                  <span>Revenue: ₹{Number(s.total_sales).toLocaleString()}</span>
                  <span>Joined: {new Date(s.created_at).toLocaleDateString('en-IN')}</span>
                </div>
                <div style={styles.actions}>
                  {!s.is_approved ? (
                    <button onClick={() => approve(s.id, true)} style={styles.approveBtn}>
                      <CheckCircle size={16} /> Approve Seller
                    </button>
                  ) : (
                    <button onClick={() => approve(s.id, false)} style={styles.rejectBtn}>
                      <XCircle size={16} /> Revoke Approval
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1000, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  select: { padding: '0.6rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.25rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTop: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' },
  shopAvatar: { width: 44, height: 44, borderRadius: 10, background: '#1a1a2e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' },
  shopName: { fontWeight: 700, margin: '0 0 2px', fontSize: '1rem' },
  ownerName: { color: '#888', margin: 0, fontSize: '0.82rem' },
  badge: { padding: '3px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700, marginLeft: 'auto' },
  approved: { background: '#f0fdf4', color: '#10b981' },
  pending: { background: '#fff7ed', color: '#f59e0b' },
  desc: { color: '#666', fontSize: '0.87rem', marginBottom: '0.75rem', lineHeight: 1.5 },
  meta: { display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#888', marginBottom: '1rem' },
  actions: { display: 'flex', gap: 8 },
  approveBtn: { flex: 1, background: '#f0fdf4', color: '#10b981', border: '1.5px solid #bbf7d0', borderRadius: 8, padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' },
  rejectBtn: { flex: 1, background: '#fef2f2', color: '#ef4444', border: '1.5px solid #fecaca', borderRadius: 8, padding: '0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontWeight: 700, fontSize: '0.9rem' },
  empty: { background: '#fff', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
};
