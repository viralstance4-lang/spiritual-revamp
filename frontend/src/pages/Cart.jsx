import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Plus, Minus, Tag, ArrowRight, ShoppingBag, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';
import { productApi } from '../services/api';

export default function Cart() {
  const {
    items, subtotal, shippingCharge, discount, total, gift, autoApplied, upcomingGift,
    amountToFreeShipping, coupon, shippingSettings, removeFromCart, updateQuantity, applyCoupon, removeCoupon,
  } = useCart();
  const freeThreshold = shippingSettings?.prepaidFreeThreshold ?? 499;
  const [couponInput, setCouponInput] = useState('');
  const [upsells, setUpsells] = useState([]);

  useEffect(() => {
    productApi.getAll({ limit: 10 })
      .then(res => {
        const all = res.data.products || [];
        setUpsells(all.filter(p => !items.some(i => i._id === p._id)).slice(0, 2));
      })
      .catch(() => {});
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <ShoppingBag className="w-16 h-16 text-white/20" />
        <h2 className="font-serif text-2xl text-white">Your cart is empty</h2>
        <p className="text-white/50 text-center max-w-xs">
          Your soul has not yet chosen a bracelet. Let us help you find your perfect match.
        </p>
        <Link to="/collections" className="btn-primary">
          Explore Collections
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 md:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-serif text-3xl font-semibold text-white mb-2">Your Cart</h1>
        <p className="text-white/50 mb-8">{items.length} item{items.length !== 1 ? 's' : ''}</p>

        {/* Free shipping progress */}
        {amountToFreeShipping > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-gold rounded-xl p-4 mb-6"
          >
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gold-400">
                Add ₹{amountToFreeShipping.toLocaleString('en-IN')} more for FREE shipping!
              </span>
              <span className="text-white/50">
                ₹{subtotal.toLocaleString('en-IN')} / ₹{freeThreshold}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (subtotal / freeThreshold) * 100)}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gold-gradient rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Free gift progress (Auto Apply coupons) */}
        {!gift && upcomingGift && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-gold rounded-xl p-4 mb-6 border border-gold-400/20"
          >
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gold-400 flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                Spend ₹{upcomingGift.amountAway.toLocaleString('en-IN')} more to unlock a FREE {upcomingGift.giftProductName}!
              </span>
              <span className="text-white/50">
                ₹{subtotal.toLocaleString('en-IN')} / ₹{upcomingGift.minOrderValue.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (subtotal / upcomingGift.minOrderValue) * 100)}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-gold-gradient rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Free gift unlocked banner (Auto Apply) */}
        {gift && autoApplied && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-gold rounded-xl p-4 mb-6 border border-gold-400/30 flex items-center gap-3"
          >
            <Gift className="w-6 h-6 text-gold-400 flex-shrink-0" />
            <div>
              <p className="text-gold-400 font-semibold text-sm">🎁 Free Gift Added: {gift.name}</p>
              <p className="text-xs text-white/40 mt-0.5">Coupon {coupon} applied automatically</p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {items.map(item => (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  className="glass rounded-2xl p-4 md:p-6 flex gap-4"
                >
                  {/* Image */}
                  <Link to={`/products/${item.slug}`} className="flex-shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-white/10">
                      <img
                        src={item.images?.[0]?.url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.slug}`}>
                      <h3 className="font-semibold text-white hover:text-gold-400 transition-colors text-sm md:text-base truncate">
                        {item.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-white/40 mt-0.5">{item.intention || item.category}</p>
                    <p className="text-sm font-bold text-white mt-2">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </p>

                    <div className="flex items-center justify-between mt-3">
                      {/* Qty */}
                      <div className="flex items-center border border-white/10 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove */}
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-white/30 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Free gift item */}
            {gift && (
              <motion.div
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass rounded-2xl p-4 md:p-6 flex gap-4 border border-gold-400/30"
              >
                <div className="flex-shrink-0">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-gold-400/30">
                    <img
                      src={gift.image}
                      alt={gift.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-gold-400 flex-shrink-0" />
                    <h3 className="font-semibold text-white text-sm md:text-base truncate">{gift.name}</h3>
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-gold-400/15 text-gold-400">
                    Free Gift
                  </span>
                  <p className="text-sm font-bold mt-2">
                    <span className="text-white/30 line-through mr-2">₹{gift.price?.toLocaleString('en-IN')}</span>
                    <span className="text-green-400">FREE</span>
                  </p>
                  <p className="text-xs text-white/40 mt-2">Qty: 1 · Added with coupon {coupon}</p>
                </div>
              </motion.div>
            )}

            {/* Upsell section */}
            {upsells.length > 0 && (
              <div className="mt-8">
                <h3 className="font-serif text-lg font-semibold text-white mb-4">
                  Complete Your Sacred Set 🔮
                </h3>
                <p className="text-sm text-white/50 mb-4">
                  Customers who bought this also loved:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {upsells.map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="glass rounded-2xl p-6 sticky top-24">
              <h2 className="font-serif text-lg font-semibold text-white mb-6">Order Summary</h2>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Shipping</span>
                  <span className={shippingCharge === 0 ? 'text-green-400' : ''}>
                    {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-400">
                    <span>Discount ({coupon})</span>
                    <span>-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="h-px bg-white/10" />
                <div className="flex justify-between font-bold text-base text-white">
                  <span>Total</span>
                  <span>₹{total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Coupon */}
              {coupon ? (
                <div className="flex items-center justify-between px-3 py-2.5 mb-6 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-semibold text-green-400">{coupon}</span>
                    <span className="text-xs text-white/40">{autoApplied ? 'applied automatically' : 'applied'}</span>
                  </div>
                  {autoApplied ? (
                    <span className="text-[10px] uppercase tracking-wide text-gold-400/70 font-semibold">Auto</span>
                  ) : (
                    <button onClick={removeCoupon} className="text-xs text-white/30 hover:text-red-400 transition-colors">
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-3">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                      <input
                        type="text"
                        placeholder="Coupon code"
                        value={couponInput}
                        onChange={e => setCouponInput(e.target.value.toUpperCase())}
                        className="input pl-9 text-sm py-2.5"
                      />
                    </div>
                    <button
                      onClick={() => applyCoupon(couponInput)}
                      className="btn-outline py-2.5 px-4 text-sm"
                    >
                      Apply
                    </button>
                  </div>
                  <p className="text-xs text-white/30 mb-4 text-center">
                    Try: FLAT250 or FLAT100
                  </p>
                </>
              )}

              <Link to="/checkout" className="btn-primary w-full justify-center mb-3">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4" />
              </Link>

              <p className="text-xs text-center text-white/40">
               🔒 Secure Checkout
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
