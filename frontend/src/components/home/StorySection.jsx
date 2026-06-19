import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const steps = [
  { step: '01', title: 'Choose Your Intention', desc: 'Pick the bracelet that resonates with what you most want to manifest: wealth, protection, love, or energy.', emoji: '🎯' },
  { step: '02', title: 'Crystals Are Cleansed', desc: 'Every stone is cleansed under full moonlight and charged with Vedic mantras before it reaches you.', emoji: '🌕' },
  { step: '03', title: 'Set Your Affirmation', desc: 'Wear your bracelet with conscious intention. Speak your affirmation aloud. The bracelet amplifies your energy.', emoji: '🙏' },
  { step: '04', title: 'Watch Life Transform', desc: 'Thousands have reported shifts within 21 days: new opportunities, better relationships, and renewed energy.', emoji: '✨' },
];

export default function StorySection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-radial-gold pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — story */}
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium"
            >
              The Spiritual Revamp Difference
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="section-title mb-6"
            >
              Not Just Jewellery.
              <br />
              <span className="text-gold-gradient">A Spiritual Tool.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-lg leading-relaxed mb-8"
            >
              For centuries, healers and yogis across India have used crystals as energetic
              amplifiers. Each stone carries a unique vibrational frequency that interacts
              with your body's energy centers, or chakras.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="text-white/60 leading-relaxed mb-10"
            >
              Spiritual Revamp takes this ancient knowledge and combines it with modern intention-setting
              practices. The result? Bracelets that don't just look beautiful, they work.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <Link to="/about" className="btn-outline">
                Read Our Full Story
              </Link>
            </motion.div>
          </div>

          {/* Right — how it works */}
          <div className="space-y-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="flex gap-5 glass rounded-2xl p-5 hover:border-gold-500/20 transition-colors group"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-xl glass-gold flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {s.emoji}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gold-500/60">{s.step}</span>
                    <h3 className="font-semibold text-white text-sm">{s.title}</h3>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
