import { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';

const messages = [
  '✨ Free Shipping on orders above ₹499',
  '🎁 Use code WELCOME10 for 10% off your first order',
  '⭐ 50,000+ Happy Customers | COD Available',
  '🔮 Handcrafted with Real Crystals — Certified Authentic',
];

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);

  // ✅ Auto slide every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-gradient-to-r from-dark-50 via-gold-500/20 to-dark-50 border-b border-gold-500/20 py-2 px-4 relative overflow-hidden">
      {/* Animated messages */}
      <div className="flex items-center justify-center gap-3 text-center">
        <Sparkles className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
        <p className="text-xs md:text-sm text-gold-300 font-medium animate-in">
          {messages[msgIdx]}
        </p>
        <Sparkles className="w-3.5 h-3.5 text-gold-400 flex-shrink-0" />
      </div>

      {/* Close button */}
      <button
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Cycling dots */}
      <div className="flex justify-center gap-1 mt-1">
        {messages.map((_, i) => (
          <button
            key={i}
            onClick={() => setMsgIdx(i)}
            className={`w-1 h-1 rounded-full transition-all ${i === msgIdx ? 'bg-gold-500 w-3' : 'bg-white/20'}`}
          />
        ))}
      </div>
    </div>
  );
}