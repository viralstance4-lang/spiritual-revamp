import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Shield, Truck } from 'lucide-react';

const floatingOrbs = [
  { size: 400, x: '-10%', y: '-20%', color: 'rgba(212,175,55,0.06)', delay: 0 },
  { size: 300, x: '60%', y: '20%', color: 'rgba(212,175,55,0.04)', delay: 1 },
  { size: 200, x: '20%', y: '60%', color: 'rgba(236,72,153,0.04)', delay: 2 },
];

const stats = [
  { value: '50,000+', label: 'Happy Customers', icon: Star },
  { value: '100%', label: 'Authentic Crystals', icon: Shield },
  { value: 'Free', label: 'Shipping ₹499+', icon: Truck },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* Background orbs */}
      {floatingOrbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute orb pointer-events-none"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: orb.color,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{ duration: 8 + i * 2, repeat: Infinity, delay: orb.delay }}
        />
      ))}

      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left — copy */}
          <div>
            {/* Social proof pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 glass-gold rounded-full px-4 py-2 mb-8"
            >
              <div className="flex -space-x-1">
                {['🧘', '✨', '💎'].map((e, i) => (
                  <span key={i} className="text-sm">{e}</span>
                ))}
              </div>
              <span className="text-xs text-gold-300 font-medium">
                Trusted by 50,000+ spiritual seekers
              </span>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-gold-500 text-gold-500" />
                ))}
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-semibold text-white leading-[1.15] mb-6"
            >
              Wear Your <span className="text-gold-gradient">Intentions.</span>
              <br />
              Transform Your <span className="text-gold-gradient">Reality.</span>
            </motion.h1>

            {/* Sub-copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-white/60 text-lg md:text-xl leading-relaxed mb-10 max-w-lg"
            >
              Handcrafted crystal bracelets rooted in 5,000 years of Vedic wisdom.
              Each stone carries a specific frequency — aligned to your deepest desires.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <Link to="/collections" className="btn-primary group">
                Shop the Collection
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/about" className="btn-outline">
                Our Story
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-wrap gap-6"
            >
              {stats.map(({ value, label, icon: Icon }) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-gold-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="text-[11px] text-white/40">{label}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — floating product stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            {/* Main image */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative z-10"
            >
              <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&auto=format&fit=crop"
                  alt="spiritual-revamp Premium Crystal Bracelet"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-400/40 to-transparent" />
              </div>
              {/* Gold glow */}
              <div className="absolute -inset-4 bg-gold-500/10 rounded-3xl blur-xl -z-10" />
            </motion.div>

            {/* Floating card — social proof */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -right-4 md:-right-8 top-8 glass rounded-2xl p-3 max-w-[160px] shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-gold-500 text-gold-500" />
                  ))}
                </div>
              </div>
              <p className="text-xs text-white/80 leading-snug">
                "Got my promotion within 3 weeks!"
              </p>
              <p className="text-[10px] text-white/40 mt-1">— Priya, Mumbai ✓</p>
            </motion.div>

            {/* Floating card — stock alert */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="absolute -left-4 md:-left-8 bottom-12 glass rounded-2xl p-3 shadow-2xl"
            >
              <p className="text-[10px] text-orange-400 font-semibold mb-0.5">🔥 Almost Gone!</p>
              <p className="text-xs text-white/70">Only 7 left in stock</p>
              <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden w-28">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-dark-400 to-transparent pointer-events-none" />
    </section>
  );
}
