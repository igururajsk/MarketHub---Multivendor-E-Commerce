import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import Spinner from '../../components/Spinner';
import toast from 'react-hot-toast';
import { ShieldOff, ShieldCheck } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('');

  const fetchUsers = () => {
    adminAPI.getUsers(role ? { role } : {})
      .then(({ data }) => setUsers(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [role]);

  const toggle = async (id, currentStatus) => {
    try {
      await adminAPI.toggleUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u));
      toast.success(currentStatus ? 'User deactivated' : 'User activated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>Manage Users ({users.length})</h1>
          <select value={role} onChange={e => setRole(e.target.value)} style={styles.select}>
            <option value="">All Roles</option>
            <option value="buyer">Buyers</option>
            <option value="seller">Sellers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>{['Name', 'Email', 'Role', 'Joined', 'Status', 'Action'].map(h => <th key={h} style={styles.th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={styles.td}>
                    <div style={styles.userCell}>
                      <div style={styles.avatar}>{u.name[0].toUpperCase()}</div>
                      {u.name}
                    </div>
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>
                    <span style={{ ...styles.roleBadge, ...(u.role === 'admin' ? styles.roleAdmin : u.role === 'seller' ? styles.roleSeller : styles.roleBuyer) }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                  <td style={styles.td}>
                    <span style={{ color: u.is_active ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>
                      {u.is_active ? '● Active' : '● Inactive'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {u.role !== 'admin' && (
                      <button onClick={() => toggle(u.id, u.is_active)} style={{ ...styles.actionBtn, color: u.is_active ? '#ef4444' : '#10b981', borderColor: u.is_active ? '#fecaca' : '#bbf7d0' }}>
                        {u.is_active ? <><ShieldOff size={14} /> Deactivate</> : <><ShieldCheck size={14} /> Activate</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1100, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  select: { padding: '0.6rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', background: '#fff' },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '1rem', fontSize: '0.78rem', color: '#888', borderBottom: '2px solid #f5f5f5', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '0.9rem 1rem', fontSize: '0.9rem', borderBottom: '1px solid #f9f9f9' },
  userCell: { display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#e94560', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' },
  roleBadge: { padding: '2px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, textTransform: 'capitalize' },
  roleBuyer: { background: '#eff6ff', color: '#3b82f6' },
  roleSeller: { background: '#f5f3ff', color: '#8b5cf6' },
  roleAdmin: { background: '#fef2f2', color: '#e94560' },
  actionBtn: { background: '#fff', border: '1.5px solid', borderRadius: 8, padding: '0.35rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 600 },
};
