import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flame, Tag } from 'lucide-react';
import CountdownTimer from '../ui/CountdownTimer';
import { PRODUCTS } from '../../data/products';
import { productApi } from '../../services/api';

export default function UrgencySection() {
  const [product, setProduct] = useState(PRODUCTS[0]);

  useEffect(() => {
    let cancelled = false;
    productApi.getAll({ featured: 'true', limit: 1 })
      .then(res => {
        if (cancelled) return;
        const first = res.data.products?.[0];
        if (first) setProduct(first);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const salePrice    = product.price;
  const comparePrice = product.comparePrice || 0;
  const hasSale      = comparePrice > salePrice;
  const savings      = hasSale ? comparePrice - salePrice : 0;
  const discountPct  = hasSale ? Math.round((savings / comparePrice) * 100) : 0;

  return (
    <section className="py-16 px-4 md:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-3xl glass border border-gold-500/20"
          style={{
            background: 'linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(0,0,0,0) 60%)',
          }}
        >
          {/* Background orb */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
            {/* Left */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-5 h-5 text-orange-400 animate-pulse" />
                <span className="text-sm font-semibold text-orange-400">Flash Sale: Today Only</span>
              </div>

              <h2 className="font-serif text-3xl md:text-4xl text-white font-semibold mb-3 leading-tight">
                {hasSale ? `${discountPct}% Off Our` : 'Our'}{' '}
                <span className="text-gold-gradient">Bestseller</span>
              </h2>

              <p className="text-white/60 mb-6 leading-relaxed">
                The <strong className="text-white">{product.name}</strong> is flying off the shelves.
                Lock in this price before it's gone.
              </p>

              <div className="flex items-center gap-4 mb-6">
                <div>
                  <span className="font-bold text-3xl text-white">
                    ₹{salePrice?.toLocaleString('en-IN')}
                  </span>
                  {hasSale && (
                    <span className="text-white/40 line-through text-lg ml-2">
                      ₹{comparePrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
                {hasSale && (
                  <span className="badge bg-red-500 text-white font-bold">
                    SAVE ₹{savings.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <CountdownTimer hours={5} label="Offer ends in" className="mb-6" />

              <Link
                to={`/products/${product.slug}`}
                className="btn-primary inline-flex"
              >
                <Tag className="w-4 h-4" />
                Claim This Deal
              </Link>
            </div>

            {/* Right — product image */}
            <div className="flex justify-center">
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-2xl overflow-hidden border border-gold-500/20">
                  <img
                    src={product.images?.[0]?.url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -inset-4 bg-gold-500/10 rounded-2xl blur-xl -z-10" />

                {/* Stock bar */}
                <div className="absolute -bottom-4 left-0 right-0 mx-4 glass rounded-xl p-3">
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-orange-400 font-semibold">🔥 Selling fast</span>
                    <span className="text-white/50">
                      {product.stock ?? 47} left
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '76%' }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
