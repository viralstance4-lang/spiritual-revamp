import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import StarRating from '../ui/StarRating';
import { TESTIMONIALS } from '../../data/products';

export default function Testimonials() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent(i => (i === 0 ? TESTIMONIALS.length - 1 : i - 1));
  const next = () => setCurrent(i => (i === TESTIMONIALS.length - 1 ? 0 : i + 1));

  return (
    <section className="py-24 px-4 md:px-6 lg:px-8 bg-dark-50/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium"
          >
            Real Results, Real People
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-title"
          >
            What Our <span className="text-gold-gradient">Community</span> Says
          </motion.h2>
        </div>

        {/* Featured testimonial */}
        <div className="max-w-3xl mx-auto mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="glass rounded-3xl p-8 md:p-12 text-center relative"
            >
              <Quote className="w-10 h-10 text-gold-500/20 mx-auto mb-6" />
              <StarRating rating={TESTIMONIALS[current].rating} size="md" />
              <p className="text-white/80 text-lg md:text-xl leading-relaxed mt-6 mb-8 italic">
                "{TESTIMONIALS[current].text}"
              </p>
              <div>
                <p className="font-semibold text-white">{TESTIMONIALS[current].name}</p>
                <p className="text-sm text-white/40">{TESTIMONIALS[current].city}</p>
                {TESTIMONIALS[current].verified && (
                  <span className="badge-green text-[10px] mt-2">✓ Verified Purchase</span>
                )}
              </div>
              <p className="text-xs text-gold-500/60 mt-3">
                Purchased: {TESTIMONIALS[current].product}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button onClick={prev} className="btn-ghost p-2 rounded-full border border-white/10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === current ? 'w-8 bg-gold-500' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
            <button onClick={next} className="btn-ghost p-2 rounded-full border border-white/10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mini review grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.slice(0, 3).map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-5 hover:border-gold-500/20 transition-colors"
            >
              <StarRating rating={t.rating} size="xs" />
              <p className="text-sm text-white/70 mt-3 leading-relaxed line-clamp-3">
                "{t.text}"
              </p>
              <div className="flex items-center justify-between mt-4">
                <div>
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/40">{t.city}</p>
                </div>
                {t.verified && (
                  <span className="badge-green text-[10px]">✓ Verified</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Rating summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <div className="inline-flex items-center gap-4 glass-gold rounded-2xl px-8 py-4">
            <div>
              <p className="font-serif text-4xl font-bold text-gold-400">4.8</p>
              <StarRating rating={4.8} size="sm" />
            </div>
            <div className="h-10 w-px bg-gold-500/20" />
            <div className="text-left">
              <p className="font-bold text-white text-lg">3,971 Reviews</p>
              <p className="text-sm text-white/50">98% would recommend</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
