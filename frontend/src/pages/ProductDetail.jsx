import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart, Zap, Shield, Truck, Headphones,
  ChevronDown, ChevronUp, Star, Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { productApi, reviewApi } from '../services/api';
import api from '../services/api';
import StarRating from '../components/ui/StarRating';
import CountdownTimer from '../components/ui/CountdownTimer';
import ProductCard from '../components/product/ProductCard';

// ─── Review Form ───────────────────────────────────────────────────────────────
function ReviewForm({ productId, onSubmitted }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { toast.error('Please write your review'); return; }
    setSubmitting(true);
    try {
      await reviewApi.create({ product: productId, rating, title, comment });
      setSubmitted(true);
      toast.success('Review submitted! It will appear after approval.');
      onSubmitted();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="glass rounded-2xl p-6 text-center mt-8">
        <p className="text-white/60 mb-3">Share your experience with this bracelet</p>
        <Link to="/login" className="btn-outline inline-flex">Login to Write a Review</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="glass rounded-2xl p-6 text-center mt-8">
        <div className="text-4xl mb-3">🙏</div>
        <p className="text-white font-medium">Thank you for your review!</p>
        <p className="text-white/50 text-sm mt-1">It will be visible after moderation</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mt-8">
      <h3 className="font-serif text-lg font-semibold text-white mb-4">Write a Review</h3>
      <div className="mb-4">
        <p className="text-xs text-white/50 mb-2">Your Rating</p>
        <div className="flex gap-2">
          {[1,2,3,4,5].map(star => (
            <button key={star} type="button" onClick={() => setRating(star)}
              className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-white/20'}`}>
              ★
            </button>
          ))}
        </div>
      </div>
      <div className="mb-3">
        <label className="block text-xs text-white/50 mb-1.5">Review Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="input" placeholder="Summarize your experience" />
      </div>
      <div className="mb-4">
        <label className="block text-xs text-white/50 mb-1.5">Your Review *</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} className="input resize-none h-24" placeholder="How has this bracelet changed your life?" required />
      </div>
      <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : '✨ Submit Review'}
      </button>
    </form>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [related, setRelated] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('benefits');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.getOne(slug);
      setProduct(res.data.product);
      setReviews(res.data.reviews || []);
      setSelectedImage(0);

      // Fetch related products and FAQs in parallel
      const [relatedRes, faqRes] = await Promise.allSettled([
        productApi.getRelated(res.data.product._id),
        api.get('/faqs'),
      ]);
      if (relatedRes.status === 'fulfilled') setRelated(relatedRes.value.data.products || []);
      if (faqRes.status === 'fulfilled') setFaqs(faqRes.value.data.faqs || []);
    } catch {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [fetchProduct]);

  const refreshReviews = useCallback(async () => {
    if (!product?._id) return;
    try {
      const res = await reviewApi.getForProduct(product._id);
      setReviews(res.data.reviews || []);
    } catch {}
  }, [product?._id]);

  // ── Loading state ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-white/50">Product not found.</p>
      </div>
    );
  }

  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <div className="min-h-screen pb-32 md:pb-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="text-sm text-white/40 mb-8 flex items-center gap-2">
          <Link to="/" className="hover:text-white/70 transition-colors">Home</Link>
          <span>/</span>
          <Link to="/collections" className="hover:text-white/70 transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-white/70 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 xl:gap-20">
          {/* ── Left: Image gallery ── */}
          <div className="space-y-4">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative rounded-2xl overflow-hidden aspect-square border border-white/10"
            >
              {product.images?.length > 0 ? (
                <img
                  src={product.images[selectedImage]?.url}
                  alt={product.images[selectedImage]?.alt || product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <span className="text-white/20 text-sm">No image</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isBestseller && (
                  <span className="badge bg-gold-500 text-dark-400 font-bold text-xs">⭐ Bestseller</span>
                )}
                {discount > 0 && (
                  <span className="badge bg-red-500 text-white font-bold text-xs">-{discount}% OFF</span>
                )}
              </div>
            </motion.div>

            {product.images?.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                      i === selectedImage ? 'border-gold-500' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: Product info ── */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium">
              {product.intention || product.category}
            </p>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-2 leading-tight">
              {product.name}
            </h1>
            <p className="text-white/60 text-lg mb-4 italic">{product.tagline}</p>

            <div className="flex items-center gap-3 mb-6">
              <StarRating rating={product.ratings?.average || 0} count={product.ratings?.count || 0} size="sm" />
              <span className="text-sm text-white/40">|</span>
              {product.stock > 0 ? (
                <span className="text-sm text-green-400 font-medium">✓ In Stock ({product.stock} left)</span>
              ) : (
                <span className="text-sm text-red-400 font-medium">✗ Out of Stock</span>
              )}
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-bold text-4xl text-white">
                ₹{product.price.toLocaleString('en-IN')}
              </span>
              {product.comparePrice > 0 && (
                <span className="text-xl text-white/40 line-through">
                  ₹{product.comparePrice.toLocaleString('en-IN')}
                </span>
              )}
              {discount > 0 && (
                <span className="badge bg-green-500/20 text-green-400 border border-green-500/30 text-xs">
                  You save ₹{(product.comparePrice - product.price).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            <CountdownTimer hours={3} label="Offer ends in" className="mb-6" />

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex items-center border border-white/10 rounded-xl overflow-hidden">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} disabled={product.stock === 0}
                  className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                  −
                </button>
                <span className="w-12 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(q => Math.min(10, product.stock, q + 1))} disabled={product.stock === 0}
                  className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent">
                  +
                </button>
              </div>
              <button
                onClick={() => addToCart(product, qty)}
                disabled={product.stock === 0}
                className="btn-outline flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
              >
                <ShoppingCart className="w-4 h-4" />
                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </button>
              {product.stock === 0 ? (
                <button disabled className="btn-primary flex-1 justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none">
                  <Zap className="w-4 h-4" />
                  Out of Stock
                </button>
              ) : (
                <Link to="/checkout" onClick={() => addToCart(product, qty)} className="btn-primary flex-1 justify-center">
                  <Zap className="w-4 h-4" />
                  Buy Now
                </Link>
              )}
            </div>

            {product.affirmation && (
              <div className="glass-gold rounded-xl p-4 mb-6">
                <p className="text-xs uppercase tracking-widest text-gold-500 mb-1 font-medium">Your Affirmation</p>
                <p className="text-sm text-white/80 italic">"{product.affirmation}"</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Truck,       text: 'Free Ship ₹499+' },
                { icon: Headphones,  text: '24/7 Support' },
                { icon: Shield,      text: 'Secure Payment' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="glass rounded-xl p-3 text-center">
                  <Icon className="w-4 h-4 text-gold-400 mx-auto mb-1" />
                  <p className="text-[10px] text-white/50">{text}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="border-b border-white/10 mb-6 flex gap-6 overflow-x-auto">
              {[
                { key: 'benefits',     label: 'Specials' },
                { key: 'ingredients',  label: 'Description' },
                { key: 'how-to-use',   label: 'How To-Use' },
                { key: 'before-after', label: 'Before After' },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`pb-3 text-sm font-medium border-b-2 transition-all -mb-px whitespace-nowrap ${
                    activeTab === key ? 'border-gold-500 text-gold-400' : 'border-transparent text-white/40 hover:text-white/70'
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {activeTab === 'benefits' && (
                  <div className="space-y-4">
                    {product.benefits?.map((b, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-2xl flex-shrink-0">{b.icon}</span>
                        <div>
                          <h4 className="font-semibold text-white text-sm mb-1">{b.title}</h4>
                          <p className="text-sm text-white/60 leading-relaxed">{b.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {activeTab === 'ingredients' && (
                  <div
                    className="prose-quill text-sm text-white/70 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                )}
                {activeTab === 'how-to-use' && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70 leading-relaxed">{product.howToUse}</p>
                    {product.affirmation && (
                      <div className="glass-gold rounded-xl p-4 mt-4">
                        <p className="text-xs uppercase tracking-widest text-gold-500 mb-1 font-medium">Daily Affirmation</p>
                        <p className="text-sm text-white/80 italic">"{product.affirmation}"</p>
                      </div>
                    )}
                  </div>
                )}
                {activeTab === 'before-after' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass rounded-xl p-4 border-l-2 border-red-500/30">
                      <p className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Before</p>
                      <p className="text-sm text-white/60 leading-relaxed">{product.beforeAfter?.before}</p>
                    </div>
                    <div className="glass rounded-xl p-4 border-l-2 border-green-500/30">
                      <p className="text-xs font-semibold text-green-400 mb-2 uppercase tracking-wider">After</p>
                      <p className="text-sm text-white/60 leading-relaxed">{product.beforeAfter?.after}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Reviews section ── */}
        <div className="mt-20">
          <h2 className="font-serif text-2xl font-semibold text-white mb-8">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {reviews.map((r, i) => (
                <div key={r._id || i} className="glass rounded-2xl p-6">
                  <StarRating rating={r.rating} size="sm" />
                  {r.title && <p className="font-medium text-white text-sm mt-3">"{r.title}"</p>}
                  <p className="text-sm text-white/70 mt-2 leading-relaxed">"{r.comment}"</p>
                  <div className="flex items-center justify-between mt-4">
                    <div>
                      <p className="text-sm font-medium text-white">{r.name || r.user?.name}</p>
                      {r.city && <p className="text-xs text-white/40">{r.city}</p>}
                    </div>
                    {r.isVerifiedPurchase && (
                      <span className="badge bg-green-500/20 text-green-400 text-[10px]">✓ Verified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass rounded-2xl p-8 text-center mb-8">
              <Star className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-white/40">No reviews yet. Be the first to review!</p>
            </div>
          )}
        </div>

        {/* Submit Review */}
        <ReviewForm productId={product._id} onSubmitted={refreshReviews} />

        {/* ── FAQs ── */}
        {faqs.length > 0 && (
          <div className="mt-16">
            <h2 className="font-serif text-2xl font-semibold text-white mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3 max-w-3xl">
              {faqs.map((faq, i) => (
                <div key={faq._id || i} className="glass rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-medium text-white text-sm">{faq.question}</span>
                    {expandedFaq === i
                      ? <ChevronUp className="w-4 h-4 text-gold-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-white/40 flex-shrink-0" />
                    }
                  </button>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }}
                        exit={{ height: 0 }} className="overflow-hidden">
                        <p className="px-5 pb-5 text-sm text-white/60 leading-relaxed">{faq.answer}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Related products ── */}
        {related.length > 0 && (
          <div className="mt-20">
            <h2 className="font-serif text-2xl font-semibold text-white mb-8">You May Also Love</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile sticky CTA ── */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 1, type: 'spring' }}
        className="fixed bottom-0 left-0 right-0 md:hidden z-40 p-4 bg-dark-400/95 backdrop-blur-xl border-t border-white/10">
        <div className="flex gap-3">
          <div>
            <p className="text-xs text-white/50 leading-none mb-1">Price</p>
            <p className="font-bold text-white">₹{product.price.toLocaleString('en-IN')}</p>
          </div>
          <div className="flex-1 flex gap-2">
            <button onClick={() => addToCart(product, qty)}
              className="btn-outline flex-1 justify-center py-3 text-sm">
              <ShoppingCart className="w-4 h-4" />Add
            </button>
            <Link to="/checkout" onClick={() => addToCart(product, qty)}
              className="btn-primary flex-1 justify-center py-3 text-sm">
              Buy Now
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
