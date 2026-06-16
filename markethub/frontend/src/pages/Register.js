import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'buyer', shop_name: '' });
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return toast.error('Password must be at least 8 characters');
    setLoading(true);
    try {
      const user = await register(form);
      toast.success('Account created!');
      if (user.role === 'seller') navigate('/seller/dashboard');
      else navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Join MarketHub today</p>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.roleToggle}>
            {['buyer', 'seller'].map(r => (
              <button key={r} type="button"
                onClick={() => setForm(f => ({ ...f, role: r }))}
                style={{ ...styles.roleBtn, ...(form.role === r ? styles.roleBtnActive : {}) }}>
                {r === 'buyer' ? '🛍️ Buyer' : '🏪 Seller'}
              </button>
            ))}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input value={form.name} onChange={set('name')} style={styles.input} placeholder="John Doe" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} style={styles.input} placeholder="you@example.com" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password <span style={{ color: '#888', fontWeight: 400 }}>(min 8 chars, upper+lower+number)</span></label>
            <input type="password" value={form.password} onChange={set('password')} style={styles.input} placeholder="••••••••" required />
          </div>

          {form.role === 'seller' && (
            <div style={styles.field}>
              <label style={styles.label}>Shop Name</label>
              <input value={form.shop_name} onChange={set('shop_name')} style={styles.input} placeholder="My Awesome Shop" required />
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.btn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.footer}>
          Already have an account? <Link to="/login" style={styles.link}>Sign In</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8f9fa', padding: '2rem 1rem' },
  card: { background: '#fff', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 440, boxShadow: '0 4px 24px rgba(0,0,0,0.1)' },
  title: { fontSize: '1.8rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 0.5rem' },
  sub: { color: '#888', margin: '0 0 2rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  roleToggle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 },
  roleBtn: { padding: '0.65rem', border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' },
  roleBtnActive: { border: '2px solid #e94560', background: '#fff5f7', color: '#e94560' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontWeight: 600, fontSize: '0.9rem', color: '#333' },
  input: { padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none' },
  btn: { background: '#e94560', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: 4 },
  footer: { textAlign: 'center', marginTop: '1.5rem', color: '#666', fontSize: '0.9rem' },
  link: { color: '#e94560', fontWeight: 600, textDecoration: 'none' },
};
