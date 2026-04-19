import { motion } from 'framer-motion';
import { Truck, RotateCcw, Shield, CreditCard, Award, Headphones } from 'lucide-react';

const badges = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders above ₹499', color: 'text-green-400' },
  // { icon: RotateCcw, title: '7-Day Returns', desc: 'No questions asked', color: 'text-blue-400' },
  { icon: Shield, title: 'Authentic Crystals', desc: '100% certified genuine', color: 'text-gold-400' },
  { icon: CreditCard, title: 'COD Available', desc: 'Pay on delivery', color: 'text-purple-400' },
  // { icon: Award, title: '50K+ Happy Souls', desc: 'Loved across India', color: 'text-orange-400' },
  { icon: Headphones, title: '24/7 Support', desc: 'We\'re always here', color: 'text-pink-400' },
];

// Marquee ticker items
const ticker = [
  '✨ Free Shipping on ₹499+',
  '🔮 100% Authentic Crystals',
  '⭐ 4.8/5 Rating — 3,971 Reviews',
  '🚚 Fast Delivery Across India',
  '💳 COD Available Everywhere',
  '🎁 Gift Packaging Available',
  // '🔄 Easy 7-Day Returns',
  '🌙 Charged Under Full Moon',
];

export default function TrustBadges() {
  const doubledTicker = [...ticker, ...ticker];

  return (
    <>
      {/* Scrolling ticker */}
      <div className="bg-gold-500/5 border-y border-gold-500/10 py-3 overflow-hidden">
        <div
          className="flex gap-8 whitespace-nowrap"
          style={{ animation: 'marquee 30s linear infinite' }}
        >
          {doubledTicker.map((item, i) => (
            <span key={i} className="text-xs text-gold-400 font-medium flex-shrink-0">
              {item}
              <span className="mx-4 text-gold-500/30">•</span>
            </span>
          ))}
        </div>
      </div>

      {/* Badge grid */}
      <section className="py-16 px-4 md:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="glass rounded-2xl p-4 text-center hover:border-gold-500/20 transition-colors group"
            >
              <div className={`${color} mb-2 flex justify-center`}>
                <Icon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-xs font-semibold text-white mb-0.5">{title}</p>
              <p className="text-[10px] text-white/40">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}
