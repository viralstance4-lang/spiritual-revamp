import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const values = [
  { emoji: '🌿', title: 'Ethically Sourced', desc: 'Every crystal is sourced directly from certified mines in India, Brazil and Madagascar. No middlemen. No exploitation.' },
  { emoji: '🌙', title: 'Moon-Charged', desc: 'Before dispatch, every bracelet is placed under full moonlight for 12 hours to amplify its natural energy.' },
  { emoji: '🙏', title: 'Vedic Intent', desc: 'Each bracelet is blessed with Vedic mantras specific to its intention — chanted by our in-house practitioner.' },
  { emoji: '💎', title: 'Premium Quality', desc: 'We use AAA-grade crystals, 925 silver clasps, and durable elastic cord. Built to last a lifetime.' },
];

const team = [
  { name: 'Sunita Rao', role: 'Founder & Crystal Healer', bio: '20+ years of crystal healing practice. Studied at the Bihar School of Yoga.' },
  { name: 'Aryan Mehta', role: 'Co-Founder & Head of Design', bio: 'Jewellery designer turned spiritual entrepreneur. Creates every bracelet design by hand.' },
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
          <h1 className="font-serif text-4xl md:text-6xl font-semibold text-white mb-6 leading-tight">
            Born from <span className="text-gold-gradient">Struggle.</span>
            <br />Built for <span className="text-gold-gradient">Transformation.</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            spiritual-revamp didn't start as a business idea. It started as a desperate search for hope.
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
              In 2019, our founder Sunita was going through the hardest year of her life — a failed business,
              a difficult divorce, and the kind of darkness that makes you question everything.
            </p>
            <p>
              A mentor gave her a simple Black Tourmaline bracelet and said: <em className="text-white">"Wear this. Set an intention every morning. See what changes."</em>
            </p>
            <p>
              She was skeptical. But within weeks, she noticed something shifting — not magic, but clarity.
              Focus. A quiet confidence she hadn't felt in years.
            </p>
            <p>
              She dove deep into crystal healing, Vedic astrology, and chakra science. What she discovered
              was that these weren't superstitions — they were sophisticated energetic technologies refined
              over thousands of years.
            </p>
            <p className="text-white font-medium">
              She decided to make these tools accessible to every Indian who needed them — not as overpriced
              luxury items, but as genuinely transformative tools for real people.
            </p>
            <p>
              spiritual-revamp was born. Today, we've helped over 50,000 customers across India experience the
              quiet, profound power of crystal energy.
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
          <p className="text-white/60 mb-8">Find the bracelet that speaks to your soul.</p>
          <Link to="/collections" className="btn-primary">
            Shop the Collection <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
