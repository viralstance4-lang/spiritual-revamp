import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';
import { CATEGORY_INFO } from '../data/products';
import api, { productApi } from '../services/api';

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Best Rated' },
];

const priceRanges = [
  { value: 'all', label: 'All Prices' },
  { value: 'under500', label: 'Under ₹500' },
  { value: '500-1000', label: '₹500–₹1000' },
  { value: 'above1000', label: 'Above ₹1000' },
];

export default function Collection() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sort, setSort] = useState('popular');
  const [activeCategory, setActiveCategory] = useState(category || 'all');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [priceFilter, setPriceFilter] = useState('all');
  const [allProducts, setAllProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and categories in parallel
  useEffect(() => {
    setLoading(true);
    Promise.all([
      productApi.getAll({ limit: 200 }),
      api.get('/categories'),
    ])
      .then(([pRes, cRes]) => {
        setAllProducts(pRes.data.products || []);
        setDbCategories(cRes.data.categories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setActiveCategory(category || 'all');
    setSearch(searchParams.get('search') || '');
    setPriceFilter('all');
  }, [category, searchParams]);

  // Update page title whenever active category or DB categories load
  useEffect(() => {
    const info = CATEGORY_INFO[activeCategory]
      || dbCategories.find(c => c.slug === activeCategory);
    document.title = info
      ? `${info.label || info.name} Bracelets | spiritual-revamp`
      : 'All Collections | spiritual-revamp';
  }, [activeCategory, dbCategories]);

  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    if (search.trim()) {
      newParams.set('search', search);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams, { replace: true });
  }, [search, searchParams, setSearchParams]);

  const products = useMemo(() => {
    let result = allProducts.filter(p =>
      activeCategory === 'all' ? true : p.category === activeCategory
    );

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tagline?.toLowerCase().includes(q) ||
        p.intention?.toLowerCase().includes(q)
      );
    }

    // Price filter
    if (priceFilter === 'under500') result = result.filter(p => p.price < 500);
    if (priceFilter === '500-1000') result = result.filter(p => p.price >= 500 && p.price <= 1000);
    if (priceFilter === 'above1000') result = result.filter(p => p.price > 1000);

    // Sort
    if (sort === 'price_asc') result = [...result].sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') result = [...result].sort((a, b) => b.price - a.price);
    if (sort === 'newest') result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sort === 'rating') result = [...result].sort((a, b) => (b.ratings?.average ?? 0) - (a.ratings?.average ?? 0));

    return result;
  }, [allProducts, activeCategory, search, priceFilter, sort]);

  const currentDbCat = dbCategories.find(c => c.slug === activeCategory);
  const currentInfo = CATEGORY_INFO[activeCategory] || (currentDbCat ? {
    label: currentDbCat.name,
    emoji: currentDbCat.emoji || '✨',
    description: currentDbCat.description || '',
    color: currentDbCat.color || '#D4AF37',
  } : null);
  const hasFilters = search || priceFilter !== 'all' || activeCategory !== 'all';

  const resetFilters = () => {
    setSearch('');
    setPriceFilter('all');
    setActiveCategory(category || 'all');
    setSort('popular');
  };

  return (
    <div className="min-h-screen">
      {/* Hero banner */}
      <div className="relative py-8 md:py-10 px-4 text-center overflow-hidden bg-dark-50/50">
        <div className="absolute inset-0 bg-radial-gold pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-xs uppercase tracking-widest text-gold-500 mb-2 font-medium">
            {currentInfo ? 'Category' : 'Shop All'}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-0">
            {currentInfo
              ? <>{currentInfo.emoji} {currentInfo.label}</>
              : <>All <span className="text-gold-gradient">Collections</span></>
            }
          </h1>
          {currentInfo && (
            <p className="text-sm text-white/50 max-w-md mx-auto mt-2">{currentInfo.description}</p>
          )}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-12">

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search bracelets... (e.g. money, protection, love)"
            className="input pl-11 pr-10 w-full md:max-w-md"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`badge text-xs px-4 py-2 transition-all cursor-pointer ${
                activeCategory === 'all'
                  ? 'bg-gold-500 text-dark-400 border-gold-500'
                  : 'glass text-white/60 hover:text-white'
              }`}
            >
              All
            </button>
            {(dbCategories.length > 0 ? dbCategories : Object.entries(CATEGORY_INFO).map(([key, info]) => ({ slug: key, name: info.label, emoji: info.emoji }))).map(cat => (
              <button
                key={cat.slug}
                onClick={() => setActiveCategory(cat.slug)}
                className={`badge text-xs px-4 py-2 transition-all cursor-pointer ${
                  activeCategory === cat.slug
                    ? 'bg-gold-500 text-dark-400 border-gold-500'
                    : 'glass text-white/60 hover:text-white'
                }`}
              >
                {cat.emoji} {cat.name.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-white/40" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="input text-sm py-2 w-auto"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value} className="bg-dark-50">
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {priceRanges.map(range => (
            <button
              key={range.value}
              onClick={() => setPriceFilter(range.value)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                priceFilter === range.value
                  ? 'border-gold-500/50 bg-gold-500/10 text-gold-400'
                  : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white/70'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        {/* Results count + reset */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-white/40">
            {loading ? 'Loading...' : `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`}
            {search && <span className="text-gold-400/70"> for "{search}"</span>}
          </p>
          {hasFilters && !loading && (
            <button onClick={resetFilters} className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors">
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Product grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔮</p>
            <p className="text-white/50 mb-2">No products found</p>
            <p className="text-sm text-white/30 mb-6">Try adjusting your filters or search query</p>
            <button onClick={resetFilters} className="btn-outline">
              <X className="w-4 h-4" /> Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
