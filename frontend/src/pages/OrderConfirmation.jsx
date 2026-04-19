import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, ArrowRight, Sparkles } from 'lucide-react';

export default function OrderConfirmation() {
  const { orderId } = useParams();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      {/* Confetti-like orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-4 h-4 rounded-full bg-gold-500/30"
            initial={{ top: '50%', left: `${10 + i * 12}%`, scale: 0 }}
            animate={{ top: [null, '-10%'], scale: [0, 1, 0] }}
            transition={{ delay: i * 0.15, duration: 2, ease: 'easeOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-12 h-12 text-green-400" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1 className="font-serif text-3xl font-semibold text-white mb-2">
            Order Placed! 🎉
          </h1>
          <p className="text-white/60 mb-2">
            Your sacred bracelet is on its way.
          </p>
          <p className="text-sm font-mono text-gold-400 mb-8">
            Order ID: #{orderId}
          </p>

          {/* What happens next */}
          <div className="glass rounded-2xl p-6 text-left mb-8 space-y-4">
            <h3 className="font-semibold text-white text-sm mb-4">What happens next?</h3>
            {[
              { icon: '📦', title: 'Packing with Love', desc: 'Your bracelet is being packed with sage-infused packaging.' },
              { icon: '🚚', title: 'Shipping in 24-48 hrs', desc: 'Express delivery across India. You\'ll receive a tracking link.' },
              { icon: '✨', title: 'Set Your Intention', desc: 'When it arrives, hold it and speak your affirmation aloud.' },
            ].map((step, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xl">{step.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{step.title}</p>
                  <p className="text-xs text-white/50">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Affirmation */}
          <div className="glass-gold rounded-xl p-4 mb-8">
            <Sparkles className="w-4 h-4 text-gold-400 mx-auto mb-2" />
            <p className="text-sm text-gold-300 italic text-center">
              "The universe has heard your intention. Abundance is already on its way to you."
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/account" className="btn-outline w-full justify-center">
              <Package className="w-4 h-4" />
              Track Your Order
            </Link>
            <Link to="/collections" className="btn-ghost w-full justify-center">
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
