import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react';
import { trackingApi } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

const STATUS_ICONS = {
  placed: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const STATUS_COLORS = {
  placed: 'text-yellow-400',
  confirmed: 'text-blue-400',
  processing: 'text-purple-400',
  shipped: 'text-indigo-400',
  delivered: 'text-green-400',
  cancelled: 'text-red-400',
};

export default function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { toast.error('Please enter your order ID'); return; }
    setLoading(true);
    try {
      const res = await trackingApi.getByOrderId(orderId.trim().toUpperCase());
      setOrder(res.data.order);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order not found. Check your order ID.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STATUS_STEPS.indexOf(order.orderStatus) : -1;

  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest text-gold-500 mb-3 font-medium">Track Your Order</p>
          <h1 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-3">
            Where Is My <span className="text-gold-gradient">Order?</span>
          </h1>
          <p className="text-white/50">Enter your order ID to check the latest status</p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="glass rounded-2xl p-6 mb-8">
          <label className="block text-xs text-white/50 mb-2">Order ID (e.g. SS12345678)</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                className="input pl-10 uppercase"
                placeholder="SS12345678"
                maxLength={20}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary px-6">
              {loading ? (
                <div className="w-4 h-4 border-2 border-dark-400/30 border-t-dark-400 rounded-full animate-spin" />
              ) : (
                'Track'
              )}
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2">Find your Order ID in the confirmation email or SMS</p>
        </form>

        {/* Order details */}
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Status header */}
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 mb-1">Order ID</p>
                  <p className="font-mono font-bold text-white text-lg">#{order.orderId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-white/40 mb-1">Payment</p>
                  <span className={`badge text-xs uppercase ${order.paymentMethod === 'cod' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}`}>
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Paid Online'}
                  </span>
                </div>
              </div>

              {/* Progress steps */}
              {order.orderStatus !== 'cancelled' ? (
                <div className="relative mt-6">
                  <div className="flex justify-between items-center relative">
                    {/* Progress line */}
                    <div className="absolute top-4 left-0 right-0 h-0.5 bg-white/10" />
                    <div
                      className="absolute top-4 left-0 h-0.5 bg-gold-500 transition-all duration-1000"
                      style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (STATUS_STEPS.length - 1)) * 100 : 0}%` }}
                    />

                    {STATUS_STEPS.map((step, i) => {
                      const Icon = STATUS_ICONS[step];
                      const isCompleted = i <= currentStepIndex;
                      const isCurrent = i === currentStepIndex;
                      return (
                        <div key={step} className="flex flex-col items-center relative z-10">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-gold-500 text-dark-400'
                              : 'bg-dark-400 border border-white/20 text-white/30'
                          } ${isCurrent ? 'ring-2 ring-gold-500/30 ring-offset-1 ring-offset-dark-400' : ''}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <p className={`text-[10px] mt-2 font-medium capitalize ${isCompleted ? 'text-gold-400' : 'text-white/30'}`}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-400">This order has been cancelled</p>
                </div>
              )}

              {/* Tracking number */}
              {order.trackingNumber && (
                <div className="mt-4 p-3 glass-gold rounded-xl">
                  <p className="text-xs text-gold-500 mb-1">Tracking Number</p>
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-white">{order.trackingNumber}</p>
                    {order.trackingUrl && (
                      <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-gold-400 hover:text-gold-300 underline">
                        Track on courier →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Order items */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Items Ordered</h3>
              <div className="space-y-3">
                {order.items?.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                      {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.name}</p>
                      <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-white">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 mt-4 pt-4 flex justify-between">
                <span className="text-sm font-semibold text-white">Total</span>
                <span className="text-sm font-bold text-gold-400">₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Shipping address */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">Delivering To</h3>
              <p className="text-sm text-white/70 leading-relaxed">
                {order.shippingAddress?.name}<br />
                {order.shippingAddress?.line1}{order.shippingAddress?.line2 && `, ${order.shippingAddress.line2}`}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
