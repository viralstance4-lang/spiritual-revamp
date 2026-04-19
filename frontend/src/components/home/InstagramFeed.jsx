import { motion } from 'framer-motion';
import { Instagram } from 'lucide-react';

const posts = [
  'https://astrostone.in/cdn/shop/files/NK6.jpg?v=1761308078&width=1620',
  'https://astrostone.in/cdn/shop/files/L2_1.jpg?v=1761307086&width=810',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=400&auto=format&fit=crop',
];

export default function InstagramFeed() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <motion.a
          href="https://instagram.com/spiritual-revamp.in"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 mb-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <Instagram className="w-5 h-5 text-gold-400" />
          <span className="text-sm text-gold-400 font-medium">@spiritual-revamp.in</span>
        </motion.a>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="section-title"
        >
          Follow Our <span className="text-gold-gradient">Sacred Journey</span>
        </motion.h2>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
        {posts.map((url, i) => (
          <motion.a
            key={i}
            href="https://virallstance.com"
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="group relative aspect-square overflow-hidden rounded-xl border border-white/5 hover:border-gold-500/30 transition-all"
          >
            <img
              src={url}
              alt={`Instagram post ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-dark-400/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white" />
            </div>
          </motion.a>
        ))}
      </div>
    </section>
  );
}
