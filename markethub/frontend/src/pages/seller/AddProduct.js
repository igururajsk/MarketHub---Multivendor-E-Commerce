import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../../api';
import toast from 'react-hot-toast';
import { ArrowLeft, Upload } from 'lucide-react';

const CATEGORIES = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Fashion' },
  { id: 3, name: 'Home & Kitchen' },
  { id: 4, name: 'Books' },
  { id: 5, name: 'Sports' },
  { id: 6, name: 'Beauty' },
  { id: 7, name: 'Toys' },
  { id: 8, name: 'Automotive' },
];

export default function AddProduct() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', price: '', stock: '',
    category_id: '', discount_percent: '0',
  });
  const [imageUrls, setImageUrls] = useState(['']);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        category_id: parseInt(form.category_id),
        discount_percent: parseFloat(form.discount_percent || 0),
        images: imageUrls.filter(Boolean),
      };
      await productAPI.create(payload);
      toast.success('Product created successfully!');
      navigate('/seller/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create product');
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button onClick={() => navigate('/seller/products')} style={styles.back}>
          <ArrowLeft size={18} /> Back to Products
        </button>

        <h1 style={styles.title}>Add New Product</h1>

        <form onSubmit={handleSubmit} style={styles.grid}>
          {/* Left Column */}
          <div style={styles.col}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Basic Information</h2>
              <div style={styles.fields}>
                <div style={styles.field}>
                  <label style={styles.label}>Product Title *</label>
                  <input value={form.title} onChange={set('title')} style={styles.input} placeholder="e.g. Wireless Bluetooth Headphones" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Description *</label>
                  <textarea value={form.description} onChange={set('description')} style={{ ...styles.input, minHeight: 120, resize: 'vertical' }} placeholder="Describe your product..." required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Category *</label>
                  <select value={form.category_id} onChange={set('category_id')} style={styles.input} required>
                    <option value="">Select category</option>
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Product Images</h2>
              <p style={styles.hint}>Add image URLs (Cloudinary, Imgur, etc.)</p>
              {imageUrls.map((url, i) => (
                <div key={i} style={styles.imgRow}>
                  <input
                    value={url}
                    onChange={e => {
                      const updated = [...imageUrls];
                      updated[i] = e.target.value;
                      setImageUrls(updated);
                    }}
                    style={styles.input}
                    placeholder={`Image URL ${i + 1}`}
                  />
                  {url && <img src={url} alt="" style={styles.preview} onError={e => e.target.style.display = 'none'} />}
                </div>
              ))}
              {imageUrls.length < 5 && (
                <button type="button" onClick={() => setImageUrls(u => [...u, ''])} style={styles.addImgBtn}>
                  <Upload size={15} /> Add Another Image
                </button>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div style={styles.col}>
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Pricing & Stock</h2>
              <div style={styles.fields}>
                <div style={styles.field}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input type="number" min="0.01" step="0.01" value={form.price} onChange={set('price')} style={styles.input} placeholder="999" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Discount % <span style={{ color: '#aaa' }}>(optional)</span></label>
                  <input type="number" min="0" max="100" value={form.discount_percent} onChange={set('discount_percent')} style={styles.input} placeholder="0" />
                </div>
                {form.price && (
                  <div style={styles.pricePreview}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>Buyer pays:</p>
                    <p style={styles.finalPrice}>
                      ₹{(form.price * (1 - (form.discount_percent || 0) / 100)).toFixed(0)}
                      {form.discount_percent > 0 && <span style={styles.discTag}>{form.discount_percent}% off</span>}
                    </p>
                  </div>
                )}
                <div style={styles.field}>
                  <label style={styles.label}>Stock Quantity *</label>
                  <input type="number" min="0" value={form.stock} onChange={set('stock')} style={styles.input} placeholder="100" required />
                </div>
              </div>
            </div>

            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Note</h2>
              <p style={styles.hint}>Your product will be visible only after your seller account is approved by admin. New products go live immediately if you're already approved.</p>
              <button type="submit" disabled={loading} style={styles.submitBtn}>
                {loading ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1000, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem', fontSize: '0.9rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1.5rem' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' },
  col: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  card: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  cardTitle: { fontSize: '1rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1rem' },
  fields: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontWeight: 600, fontSize: '0.88rem', color: '#444' },
  input: { padding: '0.7rem 1rem', border: '2px solid #e5e7eb', borderRadius: 8, fontSize: '0.95rem', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' },
  hint: { color: '#888', fontSize: '0.85rem', margin: '0 0 0.75rem', lineHeight: 1.6 },
  imgRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  preview: { width: 40, height: 40, objectFit: 'cover', borderRadius: 6 },
  addImgBtn: { background: 'none', border: '2px dashed #e5e7eb', color: '#888', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', width: '100%', justifyContent: 'center', marginTop: 4 },
  pricePreview: { background: '#f8f9fa', borderRadius: 8, padding: '0.75rem 1rem' },
  finalPrice: { fontSize: '1.4rem', fontWeight: 800, color: '#1a1a2e', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 8 },
  discTag: { background: '#fee2e2', color: '#e94560', fontSize: '0.75rem', padding: '2px 8px', borderRadius: 20, fontWeight: 600 },
  submitBtn: { width: '100%', background: '#e94560', color: '#fff', border: 'none', borderRadius: 8, padding: '0.9rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' },
};
