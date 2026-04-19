import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Package, MapPin, CreditCard,
  Truck, CheckCircle, Clock, XCircle, RotateCcw,
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  placed:     { color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',     icon: Clock },
  confirmed:  { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: CheckCircle },
  processing: { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: Package },
  shipped:    { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Truck },
  delivered:  { color: 'bg-green-500/20 text-green-400 border-green-500/30',  icon: CheckCircle },
  cancelled:  { color: 'bg-red-500/20 text-red-400 border-red-500/30',        icon: XCircle },
  returned:   { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: RotateCcw },
};

const TIMELINE_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.placed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border uppercase tracking-wider ${s.color}`}>
      <s.icon className="w-3.5 h-3.5" />
      {status}
    </span>
  );
}

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(err => setError(err.response?.data?.message || 'Order not found.'))
      .finally(() => setLoading(false));
  }, [id, user]);

  if (!user) return null;

  // ── Loading skeleton
  if (loading) return (
    <div className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="h-8 skeleton rounded w-1/3" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-5 animate-pulse space-y-3">
            <div className="h-4 skeleton rounded w-1/2" />
            <div className="h-4 skeleton rounded w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center">
      <div className="text-center">
        <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
        <p className="text-white/50 mb-4">{error}</p>
        <Link to="/orders" className="btn-outline text-sm px-5 py-2">← Back to Orders</Link>
      </div>
    </div>
  );

  const activeStep = TIMELINE_STEPS.indexOf(order.orderStatus);
  const isCancelled = ['cancelled', 'returned'].includes(order.orderStatus);

  return (
    <div className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4">
          <Link to="/orders"
            className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-gold-500/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-xl font-semibold text-white">#{order.orderId}</h1>
            <p className="text-xs text-white/40 mt-0.5">
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <StatusBadge status={order.orderStatus} />
        </motion.div>

        {/* Progress timeline (only for non-cancelled orders) */}
        {!isCancelled && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass rounded-2xl p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-5">Order Progress</h2>
            <div className="flex items-center">
              {TIMELINE_STEPS.map((step, idx) => {
                const done = idx <= activeStep;
                const active = idx === activeStep;
                return (
                  <div key={step} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                        done
                          ? 'bg-gold-500 border-gold-500'
                          : 'bg-white/5 border-white/20'
                      } ${active ? 'ring-2 ring-gold-500/30 ring-offset-1 ring-offset-dark-400' : ''}`}>
                        {done
                          ? <CheckCircle className="w-3.5 h-3.5 text-dark-400" />
                          : <div className="w-2 h-2 rounded-full bg-white/20" />
                        }
                      </div>
                      <span className={`text-[9px] mt-1.5 uppercase tracking-wide font-medium ${
                        done ? 'text-gold-400' : 'text-white/30'
                      }`}>{step}</span>
                    </div>
                    {idx < TIMELINE_STEPS.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${
                        idx < activeStep ? 'bg-gold-500' : 'bg-white/10'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            {order.trackingNumber && (
              <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs text-white/40">Tracking No.</span>
                {order.trackingUrl ? (
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-gold-400 hover:underline font-mono">
                    {order.trackingNumber}
                  </a>
                ) : (
                  <span className="text-xs text-white/60 font-mono">{order.trackingNumber}</span>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* Items */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center gap-2">
            <Package className="w-4 h-4 text-gold-400" />
            <h2 className="text-sm font-semibold text-white">
              Items ({order.items.length})
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 px-5 py-4">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-white flex-shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Price breakdown */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payment Summary
          </h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <span className="text-white/50">Subtotal</span>
              <span className="text-white">₹{order.subtotal.toLocaleString('en-IN')}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-white/50">
                  Discount {order.couponCode && <span className="text-gold-400 text-xs">({order.couponCode})</span>}
                </span>
                <span className="text-green-400">− ₹{order.discount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-white/50">Shipping</span>
              <span className={order.shippingCharge === 0 ? 'text-green-400' : 'text-white'}>
                {order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge.toLocaleString('en-IN')}`}
              </span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/10 font-semibold">
              <span className="text-white">Total</span>
              <span className="text-gold-400 text-base">₹{order.total.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-white/40 text-xs">Payment Method</span>
              <span className="text-white/60 text-xs capitalize">
                {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-xs">Payment Status</span>
              <span className={`text-xs capitalize ${
                order.paymentStatus === 'paid' ? 'text-green-400' :
                order.paymentStatus === 'failed' ? 'text-red-400' : 'text-yellow-400'
              }`}>{order.paymentStatus}</span>
            </div>
          </div>
        </motion.div>

        {/* Shipping address */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass rounded-2xl p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Delivery Address
          </h2>
          <div className="text-sm text-white/70 space-y-0.5">
            <p className="font-medium text-white">{order.shippingAddress.name}</p>
            <p>{order.shippingAddress.phone}</p>
            <p>{order.shippingAddress.line1}</p>
            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
            <p>{order.shippingAddress.city}, {order.shippingAddress.state} – {order.shippingAddress.pincode}</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="flex gap-3">
          <Link to="/orders" className="btn-outline flex-1 justify-center py-3 text-sm">
            ← All Orders
          </Link>
          <Link to="/collections" className="btn-primary flex-1 justify-center py-3 text-sm">
            Shop Again
          </Link>
        </motion.div>

      </div>
    </div>
  );
}
