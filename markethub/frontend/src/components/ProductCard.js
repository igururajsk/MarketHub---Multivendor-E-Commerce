import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { wishlistAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProductCard({ product }) {
  const { addToCart } = useCart() || {};
  const { user } = useAuth();

  const discountedPrice = product.price * (1 - (product.discount_percent || 0) / 100);

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login first');
    try {
      const { data } = await wishlistAPI.toggle(product.id);
      toast.success(data.message);
    } catch { toast.error('Failed'); }
  };

  const handleCart = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Please login first');
    await addToCart(product.id, 1);
  };

  const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
  const image = images?.[0] || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <Link to={`/products/${product.id}`} style={styles.card}>
      <div style={styles.imgWrap}>
        <img src={image} alt={product.title} style={styles.img} />
        {product.discount_percent > 0 && (
          <span style={styles.badge}>{product.discount_percent}% OFF</span>
        )}
        <button onClick={handleWishlist} style={styles.wishBtn}><Heart size={16} /></button>
      </div>
      <div style={styles.body}>
        <p style={styles.shop}>{product.shop_name}</p>
        <h3 style={styles.title}>{product.title}</h3>
        <div style={styles.rating}>
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span>{Number(product.rating || 0).toFixed(1)}</span>
          <span style={{ color: '#999' }}>({product.review_count})</span>
        </div>
        <div style={styles.priceRow}>
          <span style={styles.price}>₹{discountedPrice.toFixed(0)}</span>
          {product.discount_percent > 0 && (
            <span style={styles.original}>₹{Number(product.price).toFixed(0)}</span>
          )}
        </div>
        <button onClick={handleCart} style={styles.cartBtn}>
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </Link>
  );
}

const styles = {
  card: { background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textDecoration: 'none', color: 'inherit', display: 'block', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-4px)' } },
  imgWrap: { position: 'relative', height: 200, background: '#f5f5f5' },
  img: { width: '100%', height: '100%', objectFit: 'cover' },
  badge: { position: 'absolute', top: 8, left: 8, background: '#e94560', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20 },
  wishBtn: { position: 'absolute', top: 8, right: 8, background: '#fff', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  body: { padding: '0.75rem 1rem 1rem' },
  shop: { fontSize: 11, color: '#888', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: 0.5 },
  title: { fontSize: '0.9rem', fontWeight: 600, margin: '0 0 6px', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' },
  rating: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#555', marginBottom: 8 },
  priceRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  price: { fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e' },
  original: { fontSize: '0.85rem', color: '#999', textDecoration: 'line-through' },
  cartBtn: { width: '100%', background: '#1a1a2e', color: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 600 },
};
