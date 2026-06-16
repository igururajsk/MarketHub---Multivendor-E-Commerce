import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../api';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import { Search, SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', slug: '' },
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Books', slug: 'books' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Beauty', slug: 'beauty' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const category = searchParams.get('category') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const sort = searchParams.get('sort') || 'created_at';

  useEffect(() => {
    setLoading(true);
    productAPI.getAll({ category, page, sort, search, limit: 12 })
      .then(({ data }) => { setProducts(data.data); setPagination(data.pagination); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, page, sort, search]);

  const updateParam = (key, val) => {
    const params = Object.fromEntries(searchParams.entries());
    if (val) params[key] = val; else delete params[key];
    params.page = '1';
    setSearchParams(params);
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.searchBox}>
            <Search size={18} color="#888" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateParam('search', search)}
              placeholder="Search products..."
              style={styles.searchInput}
            />
          </div>
          <select value={sort} onChange={e => updateParam('sort', e.target.value)} style={styles.select}>
            <option value="created_at">Newest</option>
            <option value="price">Price: Low to High</option>
            <option value="rating">Top Rated</option>
            <option value="review_count">Most Reviewed</option>
          </select>
        </div>

        {/* Category pills */}
        <div style={styles.pills}>
          {CATEGORIES.map(c => (
            <button key={c.slug}
              onClick={() => updateParam('category', c.slug)}
              style={{ ...styles.pill, ...(category === c.slug ? styles.pillActive : {}) }}>
              {c.name}
            </button>
          ))}
        </div>

        {/* Products */}
        {loading ? <Spinner /> : (
          <>
            <p style={styles.count}>{pagination.total} products found</p>
            {products.length === 0 ? (
              <div style={styles.empty}>
                <SlidersHorizontal size={48} color="#ccc" />
                <p>No products found. Try different filters.</p>
              </div>
            ) : (
              <div style={styles.grid}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={styles.pagination}>
                {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                  <button key={p}
                    onClick={() => updateParam('page', p)}
                    style={{ ...styles.pageBtn, ...(page === p ? styles.pageBtnActive : {}) }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { background: '#f8f9fa', minHeight: '80vh', padding: '2rem 1rem' },
  container: { maxWidth: 1200, margin: '0 auto' },
  header: { display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' },
  searchBox: { flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '2px solid #e5e7eb', borderRadius: 10, padding: '0 1rem' },
  searchInput: { border: 'none', outline: 'none', flex: 1, padding: '0.75rem 0', fontSize: '0.95rem' },
  select: { padding: '0.75rem 1rem', border: '2px solid #e5e7eb', borderRadius: 10, background: '#fff', fontSize: '0.9rem', cursor: 'pointer' },
  pills: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '1.5rem' },
  pill: { padding: '0.4rem 1rem', border: '2px solid #e5e7eb', borderRadius: 20, background: '#fff', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem' },
  pillActive: { border: '2px solid #e94560', background: '#e94560', color: '#fff' },
  count: { color: '#888', fontSize: '0.85rem', marginBottom: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  empty: { textAlign: 'center', padding: '4rem', color: '#999', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' },
  pagination: { display: 'flex', gap: 8, justifyContent: 'center', marginTop: '2rem' },
  pageBtn: { width: 36, height: 36, border: '2px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontWeight: 600 },
  pageBtnActive: { border: '2px solid #e94560', background: '#e94560', color: '#fff' },
};
