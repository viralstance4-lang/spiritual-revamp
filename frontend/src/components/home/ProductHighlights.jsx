import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import ProductCard from '../product/ProductCard';
import { ProductCardSkeleton } from '../ui/Skeleton';
import { productApi } from '../../services/api';

export default function ProductHighlights() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    productApi.getAll({ featured: 'true', limit: 8 })
      .then(res => {
        if (cancelled) return;
        const list = res.data.products || [];
        // If fewer than 4 featured, fall back to any active products
        if (list.length < 4) {
          return productApi.getAll({ limit: 8 }).then(r => {
            if (!cancelled) setProducts(r.data.products || []);
          });
        }
        setProducts(list);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium"
        >
          Let your energy guide your choice
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title mb-4"
        >
          Where Intention Meets <span className="text-gold-gradient">Craft</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="section-subtitle max-w-xl mx-auto"
        >
          Each creation carries a deeper meaning, made to resonate with your personal path. Trust what draws you in it&rsquo;s meant for you.
        </motion.p>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : displayProducts.map((product, i) => (
            <ProductCard key={product._id} product={product} index={i} />
          ))
        }
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <Link to="/collections" className="btn-outline group">
          View All Collections
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>
    </section>
  );
}
