import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CATEGORY_INFO } from '../../data/products';
import api from '../../services/api';

// Fallback images for slugs that match known categories
const FALLBACK_IMAGES = {
  money:      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&auto=format&fit=crop',
  protection: 'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=600&auto=format&fit=crop',
  love:       'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&auto=format&fit=crop',
  energy:     'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop',
};

// Build static fallback list from CATEGORY_INFO so we never show empty grid
const STATIC_CATEGORIES = Object.entries(CATEGORY_INFO).map(([key, info]) => ({
  _id:         key,
  slug:        key,
  name:        info.label,
  description: info.description,
  emoji:       info.emoji,
  color:       info.color,
  imageUrl:    FALLBACK_IMAGES[key] || '',
}));

export default function CategoryGrid() {
  const [categories, setCategories] = useState(STATIC_CATEGORIES);

  useEffect(() => {
    let cancelled = false;
    api.get('/categories')
      .then(res => {
        if (cancelled) return;
        const list = res.data.categories || [];
        if (list.length > 0) setCategories(list);
      })
      .catch(() => {}); // keep static fallback on error
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium"
        >
          What Do You Seek?
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Shop by <span className="text-gold-gradient">Intention</span>
        </motion.h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {categories.map((cat, i) => {
          const image = cat.imageUrl || FALLBACK_IMAGES[cat.slug] || FALLBACK_IMAGES[cat.name?.toLowerCase()] || '';
          const color = cat.color || '#D4AF37';

          return (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
            >
              <Link
                to={`/collections/${cat.slug}`}
                className="group block relative overflow-hidden rounded-2xl aspect-[3/4] border border-white/5 hover:border-white/20 transition-all duration-500 hover:shadow-glow"
              >
                {image ? (
                  <img
                    src={image}
                    alt={cat.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-white/5 flex items-center justify-center">
                    <span className="text-5xl">{cat.emoji}</span>
                  </div>
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-400/90 via-dark-400/30 to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
                  <span className="text-2xl mb-2 block">{cat.emoji}</span>
                  <h3 className="font-serif text-sm md:text-base font-semibold text-white leading-tight mb-1">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-xs text-white/50 leading-snug hidden md:block mb-3">
                      {cat.description}
                    </p>
                  )}
                  <div
                    className="flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ color }}
                  >
                    Shop Now <ArrowRight className="w-3 h-3" />
                  </div>
                </div>

                {/* Color accent dot */}
                <div
                  className="absolute top-3 left-3 w-2 h-2 rounded-full opacity-70"
                  style={{ background: color, boxShadow: `0 0 8px ${color}` }}
                />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
