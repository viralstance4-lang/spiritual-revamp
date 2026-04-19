import { Star } from 'lucide-react';

export default function StarRating({ rating = 0, count, size = 'sm', interactive = false, onChange }) {
  const sizes = { xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5', lg: 'w-6 h-6' };
  const iconSize = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(star)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star
              className={`${iconSize} transition-colors ${
                star <= Math.round(rating)
                  ? 'fill-gold-500 text-gold-500'
                  : 'fill-transparent text-white/20'
              }`}
            />
          </button>
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs text-white/50 ml-1">
          ({count.toLocaleString('en-IN')})
        </span>
      )}
    </div>
  );
}
