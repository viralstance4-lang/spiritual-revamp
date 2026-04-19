import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, ChevronRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_STYLES = {
  placed:     'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed:  'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  shipped:    'bg-purple-500/20 text-purple-400 border-purple-500/30',
  delivered:  'bg-green-500/20 text-green-400 border-green-500/30',
  cancelled:  'bg-red-500/20 text-red-400 border-red-500/30',
  returned:   'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    api.get('/orders/my')
      .then(res => setOrders(res.data.orders || []))
      .catch(() => setError('Failed to load orders. Please try again.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen py-12 px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to="/account" className="w-9 h-9 glass rounded-xl flex items-center justify-center hover:border-gold-500/30 transition-colors">
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-semibold text-white">My Orders</h1>
            <p className="text-sm text-white/40">{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
          </div>
        </motion.div>

        {/* States */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass rounded-2xl p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-xl skeleton flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 skeleton rounded w-1/3" />
                    <div className="h-3 skeleton rounded w-1/2" />
                    <div className="h-3 skeleton rounded w-1/4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="glass rounded-2xl p-6 text-center border-red-500/20">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-12 text-center"
          >
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl text-white mb-2">No orders yet</h3>
            <p className="text-white/40 text-sm mb-6">When you place an order, it will appear here.</p>
            <Link to="/collections" className="btn-primary text-sm px-6 py-3">
              Shop Now
            </Link>
          </motion.div>
        )}

        {!loading && !error && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order, i) => (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/orders/${order._id}`}
                  className="glass rounded-2xl p-5 flex flex-col sm:flex-row gap-4 hover:border-gold-500/20 transition-colors block"
                >
                  {/* Product thumbnails */}
                  <div className="flex -space-x-2 flex-shrink-0">
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx}
                        className="w-14 h-14 rounded-xl border-2 border-dark-400 overflow-hidden bg-white/5 flex-shrink-0"
                        style={{ zIndex: order.items.length - idx }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-5 h-5 text-white/20" />
                          </div>
                        )}
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-14 h-14 rounded-xl border-2 border-dark-400 bg-white/10 flex items-center justify-center text-xs text-white/60 font-medium flex-shrink-0">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <p className="font-medium text-white text-sm">#{order.orderId}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                          {' · '}
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase tracking-wider ${STATUS_STYLES[order.orderStatus] || STATUS_STYLES.placed}`}>
                        {order.orderStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-gold-400 font-semibold text-sm">
                        ₹{order.total.toLocaleString('en-IN')}
                      </p>
                      <span className="text-xs text-white/30 flex items-center gap-1">
                        View details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    {order.trackingNumber && (
                      <p className="text-xs text-white/30 mt-1">
                        Tracking: <span className="text-white/50">{order.trackingNumber}</span>
                      </p>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
