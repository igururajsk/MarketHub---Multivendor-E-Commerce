import { useState } from 'react';
import { adminAPI } from '../../api';
import toast from 'react-hot-toast';
import { Tag, Plus } from 'lucide-react';

export default function AdminCoupons() {
  const [form, setForm] = useState({
    code: '', discount_type: 'percent', discount_value: '',
    min_order_amount: '', max_discount: '', usage_limit: '1', expires_at: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await adminAPI.createCoupon({
        ...form,
        discount_value: parseFloat(form.discount_value),
        min_order_amount: parseFloat(form.min_order_amount || 0),
        max_discount: form.max_discount ? parseFloat(form.max_discount) : null,
        usage_limit: parseInt(form.usage_limit),
      });
      toast.success(`Coupon ${form.code.toUpperCase()} created!`);
      setForm({ code: '', discount_type: 'percent', discount_value: '', min_order_amount: '', max_discount: '', usage_limit: '1', expires_at: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create coupon');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}><Tag size={22} /> Coupon Management</h1>

        <div style={styles.grid}>
          <div style={styles.card}>
            <h2 style={styles.cardTitle}><Plus size={18} /> Create New Coupon</h2>
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Coupon Code *</label>
                <input value={form.code} onChange={set('code')} style={styles.input} placeholder="SAVE20" required
                  onInput={e => e.target.value = e.target.value.toUpperCase()} />
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Discount Type *</label>
                  <select value={form.discount_type} onChange={set('discount_type')} style={styles.input}>
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Value *</label>
                  <input type="number" min="0.01" value={form.discount_value} onChange={set('discount_value')} style={styles.input}
                    placeholder={form.discount_type === 'percent' ? '20' : '100'} required />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Min Order (₹)</label>
                  <input type="number" min="0" value={form.min_order_amount} onChange={set('min_order_amount')} style={styles.input} placeholder="0" />
                </div>
                {form.discount_type === 'percent' && (
                  <div style={styles.field}>
                    <label style={styles.label}>Max Discount (₹)</label>
                    <input type="number" min="0" value={form.max_discount} onChange={set('max_discount')} style={styles.input} placeholder="500" />
                  </div>
                )}
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Usage Limit *</label>
                  <input type="number" min="1" value={form.usage_limit} onChange={set('usage_limit')} style={styles.input} placeholder="1" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Expires At *</label>
                  <input type="datetime-local" value={form.expires_at} onChange={set('expires_at')} style={styles.input} required />
                </div>
              </div>

              {form.code && form.discount_value && (
                <div style={styles.preview}>
                  <p style={styles.previewTitle}>Preview</p>
                  <p style={styles.previewCode}>{form.code.toUpperCase()}</p>
                  <p style={styles.previewDesc}>
                    {form.discount_type === 'percent'
                      ? `${form.discount_value}% off${form.max_discount ? ` (max ₹${form.max_discount})` : ''}`
                      : `₹${form.discount_value} off`}
                    {form.min_order_amount > 0 && ` on orders above ₹${form.min_order_amount}`}
                  </p>
                </div>
              )}

              <button type="submit" disabled={loading} style={styles.btn}>
                {loading ? 'Creating...' : 'Create Coupon'}
              </button>
            </form>
          </div>

          <div style={styles.card}>
            <h2 style={styles.cardTitle}>How Coupons Work</h2>
            <div style={styles.infoList}>
              {[
                { icon: '🏷️', title: 'Percentage Discount', desc: 'Deducts a % from order total. Set max discount to cap savings.' },
                { icon: '💰', title: 'Fixed Discount', desc: 'Deducts a fixed ₹ amount regardless of order total.' },
                { icon: '🔢', title: 'Usage Limit', desc: 'How many times this coupon can be used across all buyers.' },
                { icon: '📋', title: 'Min Order', desc: 'Buyer must meet this minimum cart total to apply the coupon.' },
                { icon: '⏰', title: 'Expiry', desc: 'Coupon automatically becomes invalid after expiry date.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={styles.infoItem}>
                  <span style={styles.infoIcon}>{icon}</span>
                  <div>
                    <p style={styles.infoTitle}>{title}</p>
                    <p style={styles.infoDesc}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 900, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.5rem', alignItems: 'start' },
  card: { background: '#fff', borderRadius: 12, padding: '1.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: 6 },
  form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontWeight: 600, fontSize: '0.85rem', color: '#444' },
  input: { padding: '0.65rem 0.9rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  preview: { background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', borderRadius: 10, padding: '1rem 1.25rem', textAlign: 'center' },
  previewTitle: { color: '#aaa', fontSize: '0.75rem', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 1 },
  previewCode: { color: '#fff', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 4px', letterSpacing: 2 },
  previewDesc: { color: '#e94560', fontSize: '0.85rem', margin: 0, fontWeight: 600 },
  btn: { background: '#e94560', color: '#fff', border: 'none', padding: '0.8rem', borderRadius: 8, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: 4 },
  infoList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  infoItem: { display: 'flex', gap: '0.75rem', alignItems: 'flex-start' },
  infoIcon: { fontSize: '1.3rem', marginTop: 2 },
  infoTitle: { fontWeight: 700, margin: '0 0 2px', fontSize: '0.9rem', color: '#1a1a2e' },
  infoDesc: { color: '#888', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 },
};
