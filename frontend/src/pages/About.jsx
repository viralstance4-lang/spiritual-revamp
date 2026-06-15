import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const values = [
  { emoji: '🌿', title: 'Ethically Sourced', desc: 'Every crystal is sourced directly from certified mines in India, Brazil and Madagascar. No middlemen. No exploitation.' },
  { emoji: '🌙', title: 'Moon Charged', desc: 'Before dispatch, every bracelet is placed under full moonlight for 12 hours to amplify its natural energy.' },
  { emoji: '🙏', title: 'Vedic Intent', desc: 'Each bracelet is blessed with Vedic mantras specific to its intention, chanted by our in-house practitioner.' },
  { emoji: '💎', title: 'Premium Quality', desc: 'We use AAA-grade crystals, 925 silver clasps, and durable elastic cord. Built to last a lifetime.' },
];

const team = [
  {
    name: 'Gunjan Shyam',
    role: 'Founder & Crystal Healer',
    bio: '20+ years of crystal healing practice. Studied at the Bihar School of Yoga.',
    emoji: '🌸',
  },
  {
    name: 'Aryan Mehta',
    role: 'Co-Founder & Head of Design',
    bio: 'Jewellery designer turned spiritual entrepreneur. Creates every bracelet design by hand.',
    emoji: '✨',
  },
];

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-radial-gold pointer-events-none" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <p className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium">Our Story</p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-6 leading-tight">
            Born from <span className="text-gold-gradient">Struggle.</span>
            <br />Built for <span className="text-gold-gradient">Transformation.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            Spiritual revamp didn't start as a business idea. It started as a desperate search for hope.
          </p>
        </motion.div>
      </div>

      {/* Story */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="prose max-w-none"
        >
          <div className="glass rounded-3xl p-8 md:p-12 space-y-6 text-white/70 text-lg leading-relaxed">
            <p>
              In 2019, life felt louder than ever. People were surrounded by stress, negativity, constant
              pressure, and a feeling of being disconnected, not just from peace, but from themselves.
            </p>
            <p className="text-white font-medium">
              That was the beginning of Spiritual Revamp.
            </p>
            <p>
              What started as a quiet search for balance slowly became a deeper journey into ancient spiritual
              wisdom, healing crystals, positive energy, manifestation, protection rituals, and mindful living.
              Not as superstition. Not as shortcuts. But as timeless practices that helped people feel calmer,
              stronger, more focused, and more aligned with their lives.
            </p>
            <p>
              The first few bracelets were shared only with close friends and family.
            </p>
            <ul className="space-y-1 pl-4 border-l border-gold-500/30">
              <li>A Nazar bracelet for protection.</li>
              <li>A crystal bracelet for confidence.</li>
              <li>A money bracelet for abundance.</li>
              <li>A love bracelet for emotional healing and connection.</li>
            </ul>
            <p className="text-white font-medium">
              And something beautiful happened.
            </p>
            <p>
              People didn't just wear them, they connected with them. They began sharing stories of positivity,
              clarity, emotional strength, better focus, and a renewed sense of belief in themselves.
            </p>
            <p className="text-white font-medium">
              That energy became the foundation of Spiritual Revamp.
            </p>
            <p>
              Today, Spiritual Revamp is more than a spiritual brand. It is a space for people who want to
              invite better energy into their lives, through carefully selected crystals, intention-based
              bracelets, spiritual tools, and meaningful products designed to support everyday life.
            </p>
            <p>
              Every product we create carries one intention: to help people feel protected, empowered,
              peaceful, and connected to the energy they want to attract.
            </p>
            <p className="text-white/50 italic text-base">
              Because sometimes, even the smallest spiritual shift can create the biggest transformation within.
            </p>
          </div>
        </motion.div>

        {/* Values */}
        <div className="mt-20">
          <h2 className="font-serif text-3xl text-white font-semibold text-center mb-12">
            Our <span className="text-gold-gradient">Promises</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-5"
              >
                <span className="text-3xl">{v.emoji}</span>
                <div>
                  <h3 className="font-semibold text-white mb-2">{v.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div className="mt-20">
          <h2 className="font-serif text-3xl text-white font-semibold text-center mb-12">
            The <span className="text-gold-gradient">People</span> Behind the Mission
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {team.map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 flex gap-5 items-start"
              >
                <div className="w-14 h-14 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                  {member.emoji}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-0.5">{member.name}</h3>
                  <p className="text-xs text-gold-400 font-medium uppercase tracking-wide mb-2">{member.role}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{member.bio}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <h2 className="font-serif text-3xl text-white font-semibold mb-4">
            Ready to Begin Your Transformation?
          </h2>
          <p className="text-white/60 mb-8">Find the product that speaks to your soul.</p>
          <Link to="/collections" className="btn-primary">
            Shop the Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
