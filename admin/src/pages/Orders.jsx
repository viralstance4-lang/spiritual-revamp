import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, Search, RefreshCw, X, User, Phone, Mail, MapPin,
  Package, CreditCard, Truck, Clock, ChevronRight, Loader2,
  CheckCircle, XCircle, AlertCircle, Trash2, Gift,
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_META = {
  placed:     { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20',     dot: 'bg-yellow-400',  icon: Clock },
  confirmed:  { color: 'bg-blue-500/20 text-blue-400 border-blue-500/20',           dot: 'bg-blue-400',    icon: CheckCircle },
  processing: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/20',     dot: 'bg-purple-400',  icon: Package },
  shipped:    { color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/20',     dot: 'bg-indigo-400',  icon: Truck },
  delivered:  { color: 'bg-green-500/20 text-green-400 border-green-500/20',        dot: 'bg-green-400',   icon: CheckCircle },
  cancelled:  { color: 'bg-red-500/20 text-red-400 border-red-500/20',              dot: 'bg-red-400',     icon: XCircle },
};

function StatusBadge({ status, size = 'sm' }) {
  const meta = STATUS_META[status] || { color: 'bg-white/10 text-white/40 border-white/10', dot: 'bg-white/40' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-${size} font-medium capitalize ${meta.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {status}
    </span>
  );
}

function PaymentBadge({ method, paymentStatus }) {
  const isPaid = paymentStatus === 'paid';
  const isCOD  = method === 'cod';
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-white/50 capitalize flex items-center gap-1">
        {isCOD ? <Truck className="w-3 h-3" /> : <CreditCard className="w-3 h-3" />}
        {isCOD ? 'Cash on Delivery' : 'Online Payment'}
      </span>
      <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full w-fit
        ${isPaid ? 'bg-green-500/20 text-green-400' :
          paymentStatus === 'failed' ? 'bg-red-500/20 text-red-400' :
          'bg-yellow-500/20 text-yellow-400'}`}>
        {paymentStatus}
      </span>
    </div>
  );
}

// ─── Order Detail Drawer ────────────────────────────────────────────────────────
function OrderDetailDrawer({ orderId, onClose, onStatusUpdated, onDeleted }) {
  const [order, setOrder]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newStatus, setNewStatus]   = useState('');
  const [tracking, setTracking]     = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [note, setNote]             = useState('');

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    api.get(`/orders/admin/${orderId}`)
      .then(res => {
        setOrder(res.data.order);
        setNewStatus(res.data.order.orderStatus);
        setTracking(res.data.order.trackingNumber || '');
        setTrackingUrl(res.data.order.trackingUrl || '');
      })
      .catch(() => toast.error('Failed to load order details'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleUpdateStatus = async () => {
    if (newStatus === order.orderStatus && tracking === (order.trackingNumber || '') && !note) return;
    setSaving(true);
    try {
      const res = await api.put(`/orders/admin/${order._id}/status`, {
        orderStatus: newStatus,
        trackingNumber: tracking || undefined,
        trackingUrl: trackingUrl || undefined,
        note: note || undefined,
      });
      setOrder(res.data.order);
      setNewStatus(res.data.order.orderStatus);
      setNote('');
      toast.success(`Status updated → ${newStatus}`);
      onStatusUpdated(order._id, newStatus);
    } catch {
      toast.error('Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/orders/admin/${order._id}`);
      toast.success(`Order #${order.orderId} deleted`);
      onDeleted(order._id);
      onClose();
    } catch {
      toast.error('Failed to delete order');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const addr = order?.shippingAddress;
  const email = order?.guestInfo?.email || order?.user?.email || '—';
  const isFinalStatus = order?.orderStatus === 'delivered' || order?.orderStatus === 'cancelled';

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-dark-50 border-l border-white/10 z-50 flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Order Details</p>
            <h2 className="font-mono font-bold text-white text-lg mt-0.5">
              #{order?.orderId || '…'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {order && !confirmDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-2 rounded-xl hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors"
                title="Delete order"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Delete confirmation bar */}
        {confirmDelete && (
          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-red-500/10 border-b border-red-500/20 flex-shrink-0">
            <p className="text-sm text-red-300">Delete this order permanently?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-3 py-1 text-xs rounded-lg border border-white/20 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 text-xs rounded-lg bg-red-500 hover:bg-red-400 text-white font-semibold transition-colors disabled:opacity-60 flex items-center gap-1"
              >
                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-gold-500" />
            </div>
          ) : !order ? (
            <div className="flex items-center justify-center py-20 text-white/30">
              <AlertCircle className="w-5 h-5 mr-2" /> Order not found
            </div>
          ) : (
            <>
              {/* Status + date row */}
              <div className="flex items-center justify-between">
                <StatusBadge status={order.orderStatus} />
                <p className="text-xs text-white/30">
                  {new Date(order.createdAt).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* ── Customer Details ── */}
              <section className="glass rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Customer
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-gold-400 font-bold text-xs">
                        {(addr?.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{addr?.name || '—'}</p>
                      {order.user && (
                        <p className="text-[10px] text-white/30">Registered user</p>
                      )}
                    </div>
                  </div>
                  <InfoRow icon={Phone} label="Phone" value={addr?.phone || '—'} />
                  <InfoRow icon={Mail}  label="Email" value={email} />
                </div>
              </section>

              {/* ── Shipping Address ── */}
              <section className="glass rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5" /> Delivery Address
                </h3>
                <div className="text-sm text-white/80 leading-relaxed">
                  <p>{addr?.line1}</p>
                  {addr?.line2 && <p>{addr.line2}</p>}
                  <p>{addr?.city}, {addr?.state} — {addr?.pincode}</p>
                </div>
                {order.notes && (
                  <div className="mt-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-xs text-yellow-300">
                    Note: {order.notes}
                  </div>
                )}
              </section>

              {/* ── Order Items ── */}
              <section className="glass rounded-2xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-3.5 h-3.5" /> Items ({order.items.length})
                </h3>
                <div className="divide-y divide-white/5">
                  {order.items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-3 py-2.5 first:pt-0 last:pb-0 ${item.isFreeGift ? 'bg-gold-400/5 -mx-1 px-1 rounded-lg' : ''}`}>
                      <div className={`w-12 h-12 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 border ${item.isFreeGift ? 'border-gold-400/30' : 'border-white/10'}`}>
                        {item.image || item.product?.images?.[0]?.url ? (
                          <img
                            src={item.image || item.product?.images?.[0]?.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/20">
                            <Package className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate flex items-center gap-1.5">
                          {item.name}
                          {item.isFreeGift && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded-full bg-gold-400/15 text-gold-400 flex-shrink-0">
                              <Gift className="w-2.5 h-2.5" /> Free Gift
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-white/40">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {item.isFreeGift ? (
                          <>
                            <p className="text-sm font-semibold text-green-400">FREE</p>
                            <p className="text-[10px] text-white/30 line-through">₹{item.originalPrice}</p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-white">
                              ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                            </p>
                            <p className="text-[10px] text-white/30">₹{item.price} each</p>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Price Breakdown ── */}
              <section className="glass rounded-2xl p-4 space-y-2">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> Price Breakdown
                </h3>
                <div className="space-y-1.5 text-sm">
                  <PriceRow label="Subtotal" value={`₹${order.subtotal?.toLocaleString('en-IN')}`} />
                  <PriceRow
                    label="Shipping"
                    value={order.shippingCharge === 0 ? 'FREE' : `₹${order.shippingCharge}`}
                    valueClass={order.shippingCharge === 0 ? 'text-green-400' : ''}
                  />
                  {order.discount > 0 && (
                    <PriceRow
                      label={`Discount${order.couponCode ? ` (${order.couponCode})` : ''}`}
                      value={`-₹${order.discount?.toLocaleString('en-IN')}`}
                      valueClass="text-green-400"
                    />
                  )}
                  {order.items.some(i => i.isFreeGift) && (
                    <PriceRow
                      label={
                        <span className="flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-gold-400" />
                          Free Gift{order.couponCode ? ` (${order.couponCode})` : ''}
                        </span>
                      }
                      value="Included"
                      valueClass="text-gold-400"
                    />
                  )}
                  <div className="border-t border-white/10 pt-2 mt-1">
                    <PriceRow
                      label="Total"
                      value={`₹${order.total?.toLocaleString('en-IN')}`}
                      bold
                    />
                  </div>
                </div>
              </section>

              {/* ── Payment Info ── */}
              <section className="glass rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <CreditCard className="w-3.5 h-3.5" /> Payment
                </h3>
                <div className="flex items-center justify-between">
                  <PaymentBadge method={order.paymentMethod} paymentStatus={order.paymentStatus} />
                  {order.razorpayPaymentId && (
                    <p className="text-[10px] font-mono text-white/30">{order.razorpayPaymentId}</p>
                  )}
                </div>
              </section>

              {/* ── Status History ── */}
              {order.statusHistory?.length > 0 && (
                <section className="glass rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> Status Timeline
                  </h3>
                  <div className="space-y-2">
                    {[...order.statusHistory].reverse().map((h, i) => {
                      const meta = STATUS_META[h.status] || {};
                      return (
                        <div key={i} className="flex items-start gap-3 text-xs">
                          <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${meta.dot || 'bg-white/20'}`} />
                          <div>
                            <span className="text-white/70 capitalize font-medium">{h.status}</span>
                            {h.note && <p className="text-white/30 mt-0.5">{h.note}</p>}
                          </div>
                          <span className="ml-auto text-white/25 flex-shrink-0">
                            {new Date(h.timestamp).toLocaleString('en-IN', {
                              day: '2-digit', month: 'short',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* ── Update Status ── */}
              {!isFinalStatus && (
                <section className="glass rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                    Update Order Status
                  </h3>
                  <select
                    value={newStatus}
                    onChange={e => setNewStatus(e.target.value)}
                    className="input w-full text-sm"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s} className="bg-dark-50 capitalize">{s}</option>
                    ))}
                  </select>
                  {(newStatus === 'shipped' || order.trackingNumber) && (
                    <>
                      <input
                        type="text"
                        value={tracking}
                        onChange={e => setTracking(e.target.value)}
                        placeholder="Tracking number (optional)"
                        className="input w-full text-sm"
                      />
                      <input
                        type="url"
                        value={trackingUrl}
                        onChange={e => setTrackingUrl(e.target.value)}
                        placeholder="Courier tracking URL (optional)"
                        className="input w-full text-sm"
                      />
                    </>
                  )}
                  {newStatus === 'cancelled' && (
                    <textarea
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder="Cancellation reason (optional)"
                      rows={2}
                      className="input w-full text-sm resize-none"
                    />
                  )}
                  <button
                    onClick={handleUpdateStatus}
                    disabled={saving}
                    className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-semibold text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {saving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                      : <><CheckCircle className="w-4 h-4" /> Save Changes</>}
                  </button>
                </section>
              )}

              {isFinalStatus && (
                <div className={`rounded-2xl p-3 text-sm text-center font-medium
                  ${order.orderStatus === 'delivered'
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                  {order.orderStatus === 'delivered' ? '✓ Order delivered' : '✕ Order cancelled'}
                  {order.orderStatus === 'cancelled' && order.cancelReason && (
                    <p className="text-xs text-white/40 mt-1">{order.cancelReason}</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
      <span className="text-white/40 w-10 flex-shrink-0">{label}</span>
      <span className="text-white/80">{value}</span>
    </div>
  );
}

function PriceRow({ label, value, bold, valueClass = '' }) {
  return (
    <div className={`flex justify-between ${bold ? 'font-bold text-white text-base' : 'text-white/60'}`}>
      <span>{label}</span>
      <span className={valueClass || (bold ? 'text-gold-400' : '')}>{value}</span>
    </div>
  );
}

// ─── Main Orders Page ───────────────────────────────────────────────────────────
export default function Orders() {
  const [orders, setOrders]           = useState([]);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading]         = useState(true);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
  const [selectedId, setSelectedId]   = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (filterStatus) params.status = filterStatus;
      if (search)       params.search = search;
      const res = await api.get('/orders/admin/all', { params });
      setOrders(res.data.orders);
      setTotal(res.data.total);
      setTotalPages(res.data.pages);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusUpdated = (orderId, newStatus) => {
    setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: newStatus } : o));
  };

  const handleOrderDeleted = (orderId) => {
    setOrders(prev => prev.filter(o => o._id !== orderId));
    setTotal(prev => prev - 1);
    setSelectedId(null);
  };

  const exportCSV = () => {
    if (!orders.length) { toast.error('No orders to export'); return; }
    const headers = ['Order ID','Date','Customer','Phone','Email','City','State','Pincode','Items','Subtotal','Shipping','Discount','Total','Payment Method','Payment Status','Order Status','Tracking'];
    const rows = orders.map(o => [
      o.orderId,
      new Date(o.createdAt).toLocaleDateString('en-IN'),
      o.shippingAddress?.name || '',
      o.shippingAddress?.phone || '',
      o.guestInfo?.email || o.user?.email || '',
      o.shippingAddress?.city || '',
      o.shippingAddress?.state || '',
      o.shippingAddress?.pincode || '',
      o.items?.map(i => `${i.name} x${i.quantity}`).join(' | ') || '',
      o.subtotal || 0,
      o.shippingCharge || 0,
      o.discount || 0,
      o.total || 0,
      o.paymentMethod,
      o.paymentStatus,
      o.orderStatus,
      o.trackingNumber || '',
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success(`Exported ${orders.length} orders`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Orders</h1>
          <p className="text-sm text-white/40 mt-0.5">{total} total orders</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchOrders} className="btn-outline py-2 px-3 text-sm flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-outline py-2 px-3 text-sm flex items-center gap-2 text-green-400 border-green-500/20 hover:border-green-500/40">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input pl-9 w-56"
            placeholder="Order ID, name or phone…"
          />
        </div>
        <select
          value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="input w-36"
        >
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s} className="bg-dark-50 capitalize">{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Date', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-white/40 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    {[...Array(8)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded skeleton w-20" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-white/30">
                    No orders found
                  </td>
                </tr>
              ) : orders.map(order => (
                <tr
                  key={order._id}
                  onClick={() => setSelectedId(order._id)}
                  className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs font-medium text-white">#{order.orderId}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">{order.shippingAddress?.name}</p>
                    <p className="text-xs text-white/40">{order.shippingAddress?.phone}</p>
                    <p className="text-xs text-white/30">{order.shippingAddress?.city}, {order.shippingAddress?.state}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[160px]">
                    <p className="text-xs text-white/70 truncate">
                      {order.items?.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">{order.items?.length} item(s)</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">₹{order.total?.toLocaleString('en-IN')}</p>
                    {order.discount > 0 && (
                      <p className="text-[10px] text-green-400">-₹{order.discount} off</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <PaymentBadge method={order.paymentMethod} paymentStatus={order.paymentStatus} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={order.orderStatus} />
                  </td>
                  <td className="px-4 py-3 text-xs text-white/40 whitespace-nowrap">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                  </td>
                  <td className="px-4 py-3">
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-400 transition-colors" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
            <p className="text-xs text-white/40">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-3 py-1 text-xs rounded-lg border border-white/10 text-white/50 hover:text-white hover:border-white/30 disabled:opacity-30 transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Drawer */}
      <AnimatePresence>
        {selectedId && (
          <OrderDetailDrawer
            key={selectedId}
            orderId={selectedId}
            onClose={() => setSelectedId(null)}
            onStatusUpdated={handleStatusUpdated}
            onDeleted={handleOrderDeleted}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
