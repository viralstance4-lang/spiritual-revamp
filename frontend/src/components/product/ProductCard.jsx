import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import StarRating from '../ui/StarRating';

const CATEGORY_COLORS = {
  money: 'text-green-400 border-green-500/30 bg-green-500/10',
  protection: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  love: 'text-pink-400 border-pink-500/30 bg-pink-500/10',
  energy: 'text-orange-400 border-orange-500/30 bg-orange-500/10',
};

export default function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const isLowStock = product.stock > 0 && product.stock <= 10;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="product-card group"
    >
      {/* Image container */}
      <Link to={`/products/${product.slug}`} className="block relative overflow-hidden aspect-square">
        <img
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-dark-400/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isBestseller && (
            <span className="badge bg-gold-500 text-dark-400 text-[10px] font-bold">
              ⭐ Bestseller
            </span>
          )}
          {discount > 0 && (
            <span className="badge bg-red-500 text-white text-[10px] font-bold">
              -{discount}%
            </span>
          )}
          {isLowStock && (
            <span className="badge bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px]">
              ⚡ Only {product.stock} left
            </span>
          )}
        </div>

        {/* Quick add on hover */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          whileHover={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-gold-500 text-dark-400 font-semibold text-sm py-2.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold-400"
          onClick={(e) => {
            e.preventDefault();
            addToCart(product);
          }}
        >
          <ShoppingCart className="w-4 h-4" />
          Add to Cart
        </motion.button>
      </Link>

      {/* Content */}
      <div className="p-4">
        {/* Category / intention badge */}
        <span className={`badge text-[10px] mb-2 ${CATEGORY_COLORS[product.category] || 'badge-gold'}`}>
          {product.intention || product.category}
        </span>

        {/* Specials (product name) */}
        <p className="text-[9px] uppercase tracking-widest text-white/30 mb-0.5 font-medium">Specials</p>
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-serif text-base font-semibold text-white hover:text-gold-400 transition-colors leading-snug mb-1 line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Tagline */}
        <p className="text-xs text-white/50 mb-3 line-clamp-1">{product.tagline}</p>

        {/* Rating */}
        {product.ratings?.count > 0 && (
          <div className="mb-3">
            <StarRating rating={product.ratings.average} count={product.ratings.count} size="xs" />
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-lg text-white">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.comparePrice && (
              <span className="text-sm text-white/40 line-through">
                ₹{product.comparePrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          <button
            onClick={() => addToCart(product)}
            className="w-9 h-9 rounded-full bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-dark-400 transition-all"
            aria-label="Add to cart"
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
