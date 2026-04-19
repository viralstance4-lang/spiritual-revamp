import { useState, useEffect } from 'react';

function getTimeLeft(targetMs) {
  const diff = targetMs - Date.now();
  if (diff <= 0) return { h: 0, m: 0, s: 0 };
  return {
    h: Math.floor(diff / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

export default function CountdownTimer({ hours = 4, label = 'Offer ends in', className = '' }) {
  const [target] = useState(() => Date.now() + hours * 3600000);
  const [time, setTime] = useState(() => getTimeLeft(Date.now() + hours * 3600000));

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const pad = n => String(n).padStart(2, '0');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-xs text-white/50">{label}:</span>
      <div className="flex items-center gap-1">
        {[time.h, time.m, time.s].map((val, i) => (
          <span key={i} className="flex items-center gap-0.5">
            <span className="inline-flex items-center justify-center w-8 h-7 bg-dark-50 border border-gold-500/30 rounded-md text-sm font-mono font-bold text-gold-400">
              {pad(val)}
            </span>
            {i < 2 && <span className="text-gold-500 font-bold text-xs">:</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
