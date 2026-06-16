import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistAPI } from '../api';
import { useCart } from '../context/CartContext';
import Spinner from '../components/Spinner';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  const fetchWishlist = () => {
    wishlistAPI.get()
      .then(({ data }) => setItems(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWishlist(); }, []);

  const remove = async (product_id) => {
    await wishlistAPI.toggle(product_id);
    setItems(prev => prev.filter(i => i.product_id !== product_id));
    toast.success('Removed from wishlist');
  };

  const moveToCart = async (product_id) => {
    await addToCart(product_id, 1);
    await remove(product_id);
  };

  if (loading) return <Spinner />;

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <h1 style={styles.title}><Heart size={24} fill="#e94560" color="#e94560" /> Wishlist ({items.length})</h1>
        {items.length === 0 ? (
          <div style={styles.empty}>
            <Heart size={56} color="#ccc" />
            <h2>Your wishlist is empty</h2>
            <Link to="/products" style={styles.shopBtn}>Explore Products</Link>
          </div>
        ) : (
          <div style={styles.grid}>
            {items.map(item => {
              const images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
              const discountedPrice = item.price * (1 - (item.discount_percent || 0) / 100);
              return (
                <div key={item.id} style={styles.card}>
                  <Link to={`/products/${item.product_id}`} style={styles.imgLink}>
                    <img src={images?.[0] || 'https://via.placeholder.com/200'} alt={item.title} style={styles.img} />
                  </Link>
                  <div style={styles.body}>
                    <Link to={`/products/${item.product_id}`} style={styles.itemTitle}>{item.title}</Link>
                    <div style={styles.priceRow}>
                      <span style={styles.price}>₹{discountedPrice.toFixed(0)}</span>
                      {item.discount_percent > 0 && (
                        <span style={styles.original}>₹{Number(item.price).toFixed(0)}</span>
                      )}
                    </div>
                    <div style={styles.actions}>
                      <button onClick={() => moveToCart(item.product_id)} style={styles.cartBtn}>
                        <ShoppingCart size={15} /> Add to Cart
                      </button>
                      <button onClick={() => remove(item.product_id)} style={styles.removeBtn}>
                        <Trash2 size={15} />
                      </button>
                    </div>
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
  container: { maxWidth: 1100, margin: '0 auto' },
  title: { fontSize: '1.5rem', fontWeight: 800, color: '#1a1a2e', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' },
  imgLink: { display: 'block', height: 180, background: '#f5f5f5' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  body: { padding: '0.85rem 1rem 1rem' },
  itemTitle: { fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e', textDecoration: 'none', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.4 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0' },
  price: { fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' },
  original: { fontSize: '0.82rem', color: '#bbb', textDecoration: 'line-through' },
  actions: { display: 'flex', gap: 8 },
  cartBtn: { flex: 1, background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '0.82rem', fontWeight: 600 },
  removeBtn: { background: '#fff', border: '2px solid #fee2e2', color: '#ef4444', borderRadius: 8, padding: '0.5rem 0.6rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  empty: { textAlign: 'center', padding: '4rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', color: '#888' },
  shopBtn: { background: '#e94560', color: '#fff', textDecoration: 'none', padding: '0.75rem 2rem', borderRadius: 8, fontWeight: 700, marginTop: '0.5rem' },
};
