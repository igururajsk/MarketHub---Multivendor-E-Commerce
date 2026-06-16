import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productAPI } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { wishlistAPI } from '../api';
import { Star, ShoppingCart, Heart, Minus, Plus, ArrowLeft } from 'lucide-react';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart() || {};
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [imgIdx, setImgIdx] = useState(0);

  useEffect(() => {
    productAPI.getOne(id)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast.error('Product not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!product) return <p style={{ padding: 40, textAlign: 'center' }}>Product not found.</p>;

  const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []);
  const discounted = product.price * (1 - (product.discount_percent || 0) / 100);
  const savings = product.price - discounted;

  const handleCart = async () => {
    if (!user) return toast.error('Please login first');
    await addToCart(product.id, qty);
  };

  const handleWishlist = async () => {
    if (!user) return toast.error('Please login first');
    const { data } = await wishlistAPI.toggle(product.id);
    toast.success(data.message);
  };

  const handleBuyNow = async () => {
    if (!user) return navigate('/login');
    await addToCart(product.id, qty);
    navigate('/cart');
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <button onClick={() => navigate(-1)} style={styles.back}><ArrowLeft size={18} /> Back</button>

        <div style={styles.grid}>
          {/* Images */}
          <div style={styles.imageSection}>
            <div style={styles.mainImg}>
              <img
                src={images[imgIdx] || 'https://via.placeholder.com/500x400?text=No+Image'}
                alt={product.title}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
              {product.discount_percent > 0 && (
                <span style={styles.discBadge}>{product.discount_percent}% OFF</span>
              )}
            </div>
            {images.length > 1 && (
              <div style={styles.thumbRow}>
                {images.map((img, i) => (
                  <img key={i} src={img} alt={`thumb-${i}`}
                    onClick={() => setImgIdx(i)}
                    style={{ ...styles.thumb, ...(imgIdx === i ? styles.thumbActive : {}) }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={styles.info}>
            <p style={styles.shopTag}>{product.shop_name}</p>
            <h1 style={styles.title}>{product.title}</h1>
            <p style={styles.category}>Category: <strong>{product.category}</strong></p>

            <div style={styles.ratingRow}>
              {[1,2,3,4,5].map(s => (
                <Star key={s} size={16}
                  fill={s <= Math.round(product.rating) ? '#f59e0b' : 'none'}
                  color={s <= Math.round(product.rating) ? '#f59e0b' : '#ddd'}
                />
              ))}
              <span style={styles.ratingText}>{Number(product.rating || 0).toFixed(1)} ({product.review_count} reviews)</span>
            </div>

            <div style={styles.priceBox}>
              <span style={styles.price}>₹{discounted.toFixed(0)}</span>
              {product.discount_percent > 0 && (
                <>
                  <span style={styles.original}>₹{Number(product.price).toFixed(0)}</span>
                  <span style={styles.savings}>You save ₹{savings.toFixed(0)}</span>
                </>
              )}
            </div>

            <p style={product.stock > 0 ? styles.inStock : styles.outOfStock}>
              {product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>

            {product.stock > 0 && (
              <>
                <div style={styles.qtyRow}>
                  <span style={styles.qtyLabel}>Quantity:</span>
                  <div style={styles.qtyControl}>
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}><Minus size={14} /></button>
                    <span style={styles.qtyVal}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} style={styles.qtyBtn}><Plus size={14} /></button>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button onClick={handleCart} style={styles.cartBtn}><ShoppingCart size={18} /> Add to Cart</button>
                  <button onClick={handleBuyNow} style={styles.buyBtn}>Buy Now</button>
                  <button onClick={handleWishlist} style={styles.wishBtn}><Heart size={18} /></button>
                </div>
              </>
            )}

            <div style={styles.descBox}>
              <h3 style={styles.descTitle}>Description</h3>
              <p style={styles.desc}>{product.description}</p>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div style={styles.reviewSection}>
          <h2 style={styles.reviewTitle}>Customer Reviews ({product.reviews?.length || 0})</h2>
          {!product.reviews?.length ? (
            <p style={styles.noReviews}>No reviews yet. Be the first to review!</p>
          ) : (
            <div style={styles.reviewGrid}>
              {product.reviews.map(r => (
                <div key={r.id} style={styles.reviewCard}>
                  <div style={styles.reviewHeader}>
                    <div style={styles.avatar}>{r.buyer_name[0].toUpperCase()}</div>
                    <div>
                      <p style={styles.reviewName}>{r.buyer_name}</p>
                      <div style={styles.stars}>
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} fill={s <= r.rating ? '#f59e0b' : 'none'} color={s <= r.rating ? '#f59e0b' : '#ddd'} />
                        ))}
                      </div>
                    </div>
                    <span style={styles.reviewDate}>{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  {r.comment && <p style={styles.reviewComment}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1100, margin: '0 auto' },
  back: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#555', marginBottom: '1.5rem', fontSize: '0.9rem', padding: 0 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2.5rem', marginBottom: '3rem' },
  imageSection: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  mainImg: { height: 380, background: '#fff', borderRadius: 12, overflow: 'hidden', position: 'relative', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' },
  discBadge: { position: 'absolute', top: 12, left: 12, background: '#e94560', color: '#fff', padding: '4px 10px', borderRadius: 20, fontSize: 13, fontWeight: 700 },
  thumbRow: { display: 'flex', gap: 8 },
  thumb: { width: 64, height: 64, objectFit: 'cover', borderRadius: 8, cursor: 'pointer', border: '2px solid transparent' },
  thumbActive: { border: '2px solid #e94560' },
  info: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  shopTag: { color: '#888', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 },
  title: { fontSize: '1.6rem', fontWeight: 800, color: '#1a1a2e', margin: 0, lineHeight: 1.3 },
  category: { color: '#666', fontSize: '0.9rem', margin: 0 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 4 },
  ratingText: { marginLeft: 6, color: '#666', fontSize: '0.9rem' },
  priceBox: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  price: { fontSize: '2rem', fontWeight: 800, color: '#1a1a2e' },
  original: { fontSize: '1.1rem', color: '#999', textDecoration: 'line-through' },
  savings: { background: '#d1fae5', color: '#065f46', padding: '2px 10px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 },
  inStock: { color: '#10b981', fontWeight: 600, margin: 0 },
  outOfStock: { color: '#ef4444', fontWeight: 600, margin: 0 },
  qtyRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  qtyLabel: { fontWeight: 600, color: '#333' },
  qtyControl: { display: 'flex', alignItems: 'center', gap: 0, border: '2px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { width: 36, height: 36, border: 'none', background: '#f5f5f5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  qtyVal: { width: 48, textAlign: 'center', fontWeight: 700 },
  actions: { display: 'flex', gap: '0.75rem' },
  cartBtn: { flex: 1, background: '#1a1a2e', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: '0.95rem' },
  buyBtn: { flex: 1, background: '#e94560', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  wishBtn: { width: 48, height: 48, border: '2px solid #e5e7eb', borderRadius: 10, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  descBox: { background: '#f8f9fa', borderRadius: 10, padding: '1rem' },
  descTitle: { fontSize: '1rem', fontWeight: 700, margin: '0 0 0.5rem' },
  desc: { color: '#555', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' },
  reviewSection: { background: '#fff', borderRadius: 12, padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  reviewTitle: { fontSize: '1.2rem', fontWeight: 700, color: '#1a1a2e', margin: '0 0 1.25rem' },
  noReviews: { color: '#999', textAlign: 'center', padding: '1rem' },
  reviewGrid: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  reviewCard: { borderBottom: '1px solid #f5f5f5', paddingBottom: '1rem' },
  reviewHeader: { display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' },
  avatar: { width: 36, height: 36, borderRadius: '50%', background: '#e94560', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 },
  reviewName: { fontWeight: 600, margin: '0 0 2px', fontSize: '0.9rem' },
  stars: { display: 'flex', gap: 2 },
  reviewDate: { marginLeft: 'auto', color: '#999', fontSize: '0.8rem' },
  reviewComment: { color: '#555', margin: 0, fontSize: '0.9rem', lineHeight: 1.6, paddingLeft: '2.75rem' },
};
