import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productAPI } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';

const CATEGORIES = [
  { name: 'Electronics', slug: 'electronics', icon: '📱' },
  { name: 'Fashion', slug: 'fashion', icon: '👗' },
  { name: 'Home & Kitchen', slug: 'home-kitchen', icon: '🏠' },
  { name: 'Books', slug: 'books', icon: '📚' },
  { name: 'Sports', slug: 'sports', icon: '⚽' },
  { name: 'Beauty', slug: 'beauty', icon: '💄' },
];

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll({ limit: 8, sort: 'rating', order: 'DESC' })
      .then(({ data }) => setFeatured(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={styles.page}>
      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>Your One-Stop<br /><span style={styles.accent}>Marketplace</span></h1>
          <p style={styles.heroSub}>Thousands of products from verified sellers across India</p>
          <div style={styles.heroButtons}>
            <Link to="/products" style={styles.primaryBtn}>Shop Now</Link>
            <Link to="/register?role=seller" style={styles.secondaryBtn}>Become a Seller</Link>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section style={styles.section}>
        <div style={styles.container}>
          <h2 style={styles.sectionTitle}>Shop by Category</h2>
          <div style={styles.categoryGrid}>
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} to={`/products?category=${cat.slug}`} style={styles.categoryCard}>
                <span style={styles.categoryIcon}>{cat.icon}</span>
                <span style={styles.categoryName}>{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section style={styles.section}>
        <div style={styles.container}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Top Rated Products</h2>
            <Link to="/products" style={styles.viewAll}>View All →</Link>
          </div>
          {loading ? <Spinner /> : (
            <div style={styles.productGrid}>
              {featured.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* Seller CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.container}>
          <div style={styles.ctaBox}>
            <h2 style={styles.ctaTitle}>Start Selling Today</h2>
            <p style={styles.ctaSub}>Join thousands of sellers growing their business on MarketHub</p>
            <Link to="/register" style={styles.ctaBtn}>Register as Seller</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const styles = {
  page: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#f8f9fa' },
  hero: { background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '5rem 1rem', textAlign: 'center' },
  heroContent: { maxWidth: 600, margin: '0 auto' },
  heroTitle: { fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.2, margin: '0 0 1rem' },
  accent: { color: '#e94560' },
  heroSub: { color: '#aaa', fontSize: '1.1rem', marginBottom: '2rem' },
  heroButtons: { display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' },
  primaryBtn: { background: '#e94560', color: '#fff', padding: '0.8rem 2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' },
  secondaryBtn: { background: 'transparent', color: '#fff', border: '2px solid #fff', padding: '0.8rem 2rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' },
  section: { padding: '3rem 1rem' },
  container: { maxWidth: 1200, margin: '0 auto' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  sectionTitle: { fontSize: '1.6rem', fontWeight: 700, color: '#1a1a2e', margin: 0 },
  viewAll: { color: '#e94560', textDecoration: 'none', fontWeight: 600 },
  categoryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' },
  categoryCard: { background: '#fff', borderRadius: 12, padding: '1.5rem 1rem', textAlign: 'center', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.2s' },
  categoryIcon: { fontSize: '2rem' },
  categoryName: { fontWeight: 600, color: '#1a1a2e', fontSize: '0.9rem' },
  productGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  ctaSection: { background: '#1a1a2e', padding: '4rem 1rem' },
  ctaBox: { maxWidth: 600, margin: '0 auto', textAlign: 'center' },
  ctaTitle: { color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0 0 0.75rem' },
  ctaSub: { color: '#aaa', marginBottom: '2rem' },
  ctaBtn: { background: '#e94560', color: '#fff', padding: '0.9rem 2.5rem', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: '1rem' },
};
