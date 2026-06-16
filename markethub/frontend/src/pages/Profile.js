import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API from '../api';
import toast from 'react-hot-toast';
import { User, Lock, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.put('/users/profile', profileForm);
      setUser(u => ({ ...u, ...profileForm }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setLoading(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await API.put('/users/password', pwForm);
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.sidebar}>
          <div style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
          <p style={styles.userName}>{user?.name}</p>
          <p style={styles.userRole}>{user?.role}</p>
          <nav style={styles.nav}>
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'password', label: 'Password', icon: Lock },
            ].map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setTab(id)} style={{ ...styles.navBtn, ...(tab === id ? styles.navBtnActive : {}) }}>
                <Icon size={16} /> {label}
              </button>
            ))}
            <button onClick={handleLogout} style={{ ...styles.navBtn, color: '#ef4444', marginTop: 'auto' }}>
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>

        <div style={styles.main}>
          {tab === 'profile' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Edit Profile</h2>
              <form onSubmit={updateProfile} style={styles.form}>
                <div style={styles.field}>
                  <label style={styles.label}>Full Name</label>
                  <input value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} style={styles.input} required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Email <span style={{ color: '#aaa' }}>(cannot change)</span></label>
                  <input value={user?.email} style={{ ...styles.input, background: '#f5f5f5', color: '#999' }} disabled />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Phone</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} style={styles.input} placeholder="+91 9999999999" />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Role</label>
                  <input value={user?.role} style={{ ...styles.input, background: '#f5f5f5', color: '#999', textTransform: 'capitalize' }} disabled />
                </div>
                <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Saving...' : 'Save Changes'}</button>
              </form>
            </div>
          )}

          {tab === 'password' && (
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Change Password</h2>
              <form onSubmit={changePassword} style={styles.form}>
                {[
                  { label: 'Current Password', key: 'current_password', placeholder: '••••••••' },
                  { label: 'New Password', key: 'new_password', placeholder: 'Min 8 chars' },
                  { label: 'Confirm New Password', key: 'confirm', placeholder: '••••••••' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key} style={styles.field}>
                    <label style={styles.label}>{label}</label>
                    <input type="password" value={pwForm[key]} onChange={e => setPwForm(f => ({ ...f, [key]: e.target.value }))} style={styles.input} placeholder={placeholder} required />
                  </div>
                ))}
                <button type="submit" disabled={loading} style={styles.btn}>{loading ? 'Updating...' : 'Update Password'}</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' },
  sidebar: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minHeight: 340 },
  avatar: { width: 72, height: 72, borderRadius: '50%', background: '#e94560', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800 },
  userName: { fontWeight: 700, fontSize: '1rem', margin: 0, color: '#1a1a2e' },
  userRole: { color: '#888', fontSize: '0.82rem', margin: 0, textTransform: 'capitalize' },
  nav: { width: '100%', display: 'flex', flexDirection: 'column', gap: 4, marginTop: '1rem', flex: 1 },
  navBtn: { background: 'transparent', border: 'none', padding: '0.6rem 0.75rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 500, color: '#555', textAlign: 'left', width: '100%' },
  navBtnActive: { background: '#fff5f7', color: '#e94560', fontWeight: 700 },
  main: {},
  card: { background: '#fff', borderRadius: 12, padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1.1rem', fontWeight: 800, color: '#1a1a2e', margin: '0 0 1.5rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontWeight: 600, fontSize: '0.88rem', color: '#444' },
  input: { padding: '0.7rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none' },
  btn: { background: '#e94560', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: 4 },
};
