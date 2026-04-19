import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="text-8xl mb-4">🔮</p>
        <h1 className="font-serif text-4xl font-semibold text-white mb-3">Page Not Found</h1>
        <p className="text-white/50 mb-8 max-w-xs">
          The universe couldn't find this page. Let's guide you back to your path.
        </p>
        <Link to="/" className="btn-primary">Return Home</Link>
      </motion.div>
    </div>
  );
}
