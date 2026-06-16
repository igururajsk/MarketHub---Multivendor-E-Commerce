import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/Spinner';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = () => {
    productAPI.getAll({ seller_id: user.id, limit: 50 })
      .then(({ data }) => setProducts(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProducts(); }, []);

  const toggleActive = async (product) => {
    try {
      await productAPI.update(product.id, { ...product, is_active: !product.is_active });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(product.is_active ? 'Product hidden' : 'Product active');
    } catch { toast.error('Failed to update'); }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Product deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.topBar}>
          <h1 style={styles.title}>My Products ({products.length})</h1>
          <Link to="/seller/products/new" style={styles.addBtn}><Plus size={18} /> Add Product</Link>
        </div>

        {products.length === 0 ? (
          <div style={styles.empty}>
            <p>No products yet.</p>
            <Link to="/seller/products/new" style={styles.addBtn}><Plus size={16} /> Add Your First Product</Link>
          </div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  {['Product', 'Price', 'Stock', 'Rating', 'Status', 'Actions'].map(h => (
                    <th key={h} style={styles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const images = typeof p.images === 'string' ? JSON.parse(p.images) : p.images;
                  return (
                    <tr key={p.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.productCell}>
                          <img src={images?.[0] || 'https://via.placeholder.com/40'} alt={p.title} style={styles.thumb} />
                          <span style={styles.productTitle}>{p.title}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.price}>₹{Number(p.price).toLocaleString()}</span>
                        {p.discount_percent > 0 && <span style={styles.disc}>{p.discount_percent}% off</span>}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.stockBadge, color: p.stock < 10 ? '#ef4444' : '#10b981', background: p.stock < 10 ? '#fee2e2' : '#f0fdf4' }}>
                          {p.stock === 0 ? 'Out of stock' : p.stock}
                        </span>
                      </td>
                      <td style={styles.td}>⭐ {Number(p.rating || 0).toFixed(1)} ({p.review_count})</td>
                      <td style={styles.td}>
                        <button onClick={() => toggleActive(p)} style={styles.toggleBtn}>
                          {p.is_active ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#ccc" />}
                          <span style={{ color: p.is_active ? '#10b981' : '#aaa', fontSize: '0.8rem' }}>
                            {p.is_active ? 'Active' : 'Hidden'}
                          </span>
                        </button>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionBtns}>
                          <Link to={`/seller/products/edit/${p.id}`} style={styles.editBtn}><Edit size={15} /></Link>
                          <button onClick={() => deleteProduct(p.id)} style={styles.deleteBtn}><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1100, margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', margin: 0 },
  addBtn: { background: '#e94560', color: '#fff', textDecoration: 'none', padding: '0.6rem 1.25rem', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 },
  tableWrap: { background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { textAlign: 'left', padding: '1rem', fontSize: '0.8rem', color: '#888', borderBottom: '2px solid #f5f5f5', textTransform: 'uppercase', letterSpacing: 0.5 },
  tr: { borderBottom: '1px solid #f9f9f9' },
  td: { padding: '1rem', fontSize: '0.9rem', verticalAlign: 'middle' },
  productCell: { display: 'flex', alignItems: 'center', gap: 10 },
  thumb: { width: 44, height: 44, objectFit: 'cover', borderRadius: 8, background: '#f5f5f5' },
  productTitle: { fontWeight: 600, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  price: { fontWeight: 700, color: '#1a1a2e' },
  disc: { fontSize: '0.75rem', color: '#e94560', marginLeft: 6 },
  stockBadge: { padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 },
  toggleBtn: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
  actionBtns: { display: 'flex', gap: 8 },
  editBtn: { background: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center', textDecoration: 'none' },
  deleteBtn: { background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 8, padding: '0.4rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  empty: { background: '#fff', borderRadius: 12, padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', color: '#888', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
};
